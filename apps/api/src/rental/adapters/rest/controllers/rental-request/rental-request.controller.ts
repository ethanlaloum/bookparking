import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Either, Schema } from 'effect/index';

import { controllerErrorHandler } from '../../../../../shared/error/controllerErrorHandler';
import { parseSchemaError } from '../../../../../shared/error/parseSchemaError';
import { AuthGuard } from '../../../../../user-management/adapters/rest/guards/auth.guard';
import { TokenRequest } from '../../../../../user-management/adapters/rest/dtos/TokenRequest';
import { ConfirmRentalRequest } from '../../../../domain/usecases/confirm-rental-request/ConfirmRentalRequest';
import { RentalRequestExpiredError } from '../../../../domain/usecases/confirm-rental-request/errors/RentalRequestExpiredError';
import { PaymentUnavailableError } from '../../../../domain/errors/PaymentUnavailableError';
import { RentalRequestNotFoundError } from '../../../../domain/errors/RentalRequestNotFoundError';
import { AbandonRentalRequest } from '../../../../domain/usecases/abandon-rental-request/AbandonRentalRequest';
import { CancelRental } from '../../../../domain/usecases/cancel-rental/CancelRental';
import { RentalAlreadyStartedError } from '../../../../domain/usecases/cancel-rental/errors/RentalAlreadyStartedError';
import { RentalNotCancellableError } from '../../../../domain/usecases/cancel-rental/errors/RentalNotCancellableError';
import { RentalRequestAlreadyPaidError } from '../../../../domain/usecases/abandon-rental-request/errors/RentalRequestAlreadyPaidError';
import { RentalRequestPaymentFailedError } from '../../../../domain/usecases/confirm-rental-request/errors/RentalRequestPaymentFailedError';
import { ListOwnerRentalRequests } from '../../../../domain/usecases/list-owner-rental-requests/ListOwnerRentalRequests';
import { ListRenterRentalRequests } from '../../../../domain/usecases/list-renter-rental-requests/ListRenterRentalRequests';
import { RequestRental } from '../../../../domain/usecases/request-rental/RequestRental';
import { RentalRequestBeingCreatedError } from '../../../../domain/usecases/request-rental/errors/RentalRequestBeingCreatedError';
import { RentalRequestMapper } from '../../../mappers/RentalRequestMapper';
import { GetRentalRequestResponseDto } from '../../dtos/GetRentalRequestResponseDto';
import { RequestRentalResponseDto } from '../../dtos/RequestRentalResponseDto';
import { RequestRentalSchema } from '../../dtos/RequestRentalSchema';

@Controller('rental-request')
export class RentalRequestController {
  constructor(
    private readonly requestRentalUseCase: RequestRental,
    private readonly confirmRentalRequestUseCase: ConfirmRentalRequest,
    private readonly listRenterRentalRequestsUseCase: ListRenterRentalRequests,
    private readonly listOwnerRentalRequestsUseCase: ListOwnerRentalRequests,
    private readonly abandonRentalRequestUseCase: AbandonRentalRequest,
    private readonly cancelRentalUseCase: CancelRental,
  ) {}

  @Get()
  @UseGuards(AuthGuard)
  public async listMyRequests(
    @Req() req: TokenRequest,
  ): Promise<GetRentalRequestResponseDto[]> {
    const result = await this.listRenterRentalRequestsUseCase.execute({
      renterId: req.user.id,
    });

    if (Either.isLeft(result))
      throw new HttpException(
        'La liste de vos demandes est indisponible',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

    return result.right.map((view) =>
      RentalRequestMapper.toGetRentalRequestDto(view),
    );
  }

  // Déclarée avant `POST :id/confirmation` par prudence, et surtout distincte
  // de `GET /` : les demandes reçues sont celles faites sur les places du
  // compte, pas celles qu'il a faites.
  @Get('received')
  @UseGuards(AuthGuard)
  public async listReceivedRequests(
    @Req() req: TokenRequest,
  ): Promise<GetRentalRequestResponseDto[]> {
    const result = await this.listOwnerRentalRequestsUseCase.execute({
      ownerId: req.user.id,
    });

    if (Either.isLeft(result))
      throw new HttpException(
        'La liste des demandes reçues est indisponible',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

    return result.right.map((view) =>
      RentalRequestMapper.toGetRentalRequestDto(view),
    );
  }

  // L'identifiant d'intention est exigé, et décodé comme un UUID : sans lui,
  // deux clics feraient deux demandes. Une intention rejouée répond la même
  // demande, et le dit par `Idempotent-Replayed`, comme Stripe.
  @Post()
  @UseGuards(AuthGuard)
  public async requestRental(
    @Req() req: TokenRequest,
    @Body() body: unknown,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Res({ passthrough: true })
    res: { setHeader(name: string, value: string): void },
  ): Promise<RequestRentalResponseDto | undefined> {
    try {
      const intent = Schema.decodeUnknownEither(Schema.UUID)(idempotencyKey);
      if (Either.isLeft(intent))
        throw new HttpException(
          "L'en-tête Idempotency-Key doit porter l'identifiant de la demande (UUID)",
          HttpStatus.BAD_REQUEST,
        );

      const decode = Schema.decodeUnknownEither(RequestRentalSchema)(body);

      if (Either.isLeft(decode))
        throw new HttpException(
          parseSchemaError(decode.left),
          HttpStatus.BAD_REQUEST,
        );

      const result = await this.requestRentalUseCase.execute({
        renterId: req.user.id,
        address: decode.right.address,
        box: decode.right.box,
        fromDay: decode.right.fromDay,
        toDay: decode.right.toDay,
        requestedAt: new Date(),
        idempotencyKey: intent.right,
      });

      if (Either.isLeft(result)) {
        if (result.left instanceof RentalRequestBeingCreatedError)
          throw new HttpException(result.left.message, HttpStatus.CONFLICT);
        if (result.left instanceof PaymentUnavailableError)
          throw new HttpException(
            result.left.message,
            HttpStatus.SERVICE_UNAVAILABLE,
          );
        throw new HttpException(
          result.left.message,
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }

      if (result.right.replayed) res.setHeader('Idempotent-Replayed', 'true');
      return {
        id: result.right.rentalRequest.id,
        checkoutUrl: result.right.checkoutUrl,
      };
    } catch (error: unknown) {
      controllerErrorHandler(error, {
        name: 'RentalRequestController',
        method: 'requestRental',
        userId: req.user.id,
      });
    }
  }

  @Post(':id/confirmation')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  public async confirmRentalRequest(
    @Req() req: TokenRequest,
    @Param('id') id: string,
  ): Promise<void> {
    try {
      // Un identifiant mal formé répond comme une demande inconnue, jamais 500 :
      // même décodage que GET /listing/:id, et surtout même réponse que pour une
      // demande qui appartient à quelqu'un d'autre.
      const decode = Schema.decodeUnknownEither(Schema.UUID)(id);

      if (Either.isLeft(decode))
        throw new HttpException(
          new RentalRequestNotFoundError().message,
          HttpStatus.NOT_FOUND,
        );

      const result = await this.confirmRentalRequestUseCase.execute({
        requestId: decode.right,
        ownerId: req.user.id,
        confirmedAt: new Date(),
      });

      if (Either.isLeft(result)) {
        const error = result.left;
        if (error instanceof RentalRequestNotFoundError)
          throw new HttpException(error.message, HttpStatus.NOT_FOUND);
        if (
          error instanceof RentalRequestExpiredError ||
          error instanceof RentalRequestPaymentFailedError
        )
          throw new HttpException(error.message, HttpStatus.CONFLICT);
        if (error instanceof PaymentUnavailableError)
          throw new HttpException(
            error.message,
            HttpStatus.SERVICE_UNAVAILABLE,
          );
        throw new HttpException(
          'La confirmation de la demande a échoué',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    } catch (error: unknown) {
      controllerErrorHandler(error, {
        name: 'RentalRequestController',
        method: 'confirmRentalRequest',
        userId: req.user.id,
      });
    }
  }

  // Appelée par le front quand le conducteur revient de Stripe sans payer :
  // les dates sont rendues tout de suite, au lieu d'attendre que la page de
  // paiement expire. Une demande d'un autre compte répond comme une inconnue.
  @Post(':id/abandonment')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  public async abandonRentalRequest(
    @Req() req: TokenRequest,
    @Param('id') id: string,
  ): Promise<void> {
    try {
      const decode = Schema.decodeUnknownEither(Schema.UUID)(id);
      if (Either.isLeft(decode))
        throw new HttpException(
          new RentalRequestNotFoundError().message,
          HttpStatus.NOT_FOUND,
        );

      const result = await this.abandonRentalRequestUseCase.execute({
        requestId: decode.right,
        renterId: req.user.id,
      });

      if (Either.isLeft(result)) {
        const error = result.left;
        if (error instanceof RentalRequestNotFoundError)
          throw new HttpException(error.message, HttpStatus.NOT_FOUND);
        if (error instanceof RentalRequestAlreadyPaidError)
          throw new HttpException(error.message, HttpStatus.CONFLICT);
        throw new HttpException(
          "L'abandon de la demande a échoué",
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    } catch (error: unknown) {
      controllerErrorHandler(error, {
        name: 'RentalRequestController',
        method: 'abandonRentalRequest',
        userId: req.user.id,
      });
    }
  }

  // Le conducteur comme le loueur passent par cette route : c'est le cas
  // d'usage qui reconnaît qui annule, et une demande que le compte ne peut ni
  // voir ni annuler répond comme une demande inconnue.
  @Post(':id/cancellation')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  public async cancelRental(
    @Req() req: TokenRequest,
    @Param('id') id: string,
  ): Promise<{ outcome: string } | undefined> {
    try {
      const decode = Schema.decodeUnknownEither(Schema.UUID)(id);
      if (Either.isLeft(decode))
        throw new HttpException(
          new RentalRequestNotFoundError().message,
          HttpStatus.NOT_FOUND,
        );

      const result = await this.cancelRentalUseCase.execute({
        requestId: decode.right,
        accountId: req.user.id,
        cancelledAt: new Date(),
      });

      if (Either.isLeft(result)) {
        const error = result.left;
        if (error instanceof RentalRequestNotFoundError)
          throw new HttpException(error.message, HttpStatus.NOT_FOUND);
        if (
          error instanceof RentalAlreadyStartedError ||
          error instanceof RentalNotCancellableError
        )
          throw new HttpException(error.message, HttpStatus.CONFLICT);
        throw new HttpException(
          "L'annulation a échoué",
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return { outcome: result.right };
    } catch (error: unknown) {
      controllerErrorHandler(error, {
        name: 'RentalRequestController',
        method: 'cancelRental',
        userId: req.user.id,
      });
    }
  }
}
