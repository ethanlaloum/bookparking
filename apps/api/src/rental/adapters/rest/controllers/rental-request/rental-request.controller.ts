import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Either, Schema } from 'effect/index';

import { controllerErrorHandler } from '../../../../../shared/error/controllerErrorHandler';
import { parseSchemaError } from '../../../../../shared/error/parseSchemaError';
import { AuthGuard } from '../../../../../user-management/adapters/rest/guards/auth.guard';
import { TokenRequest } from '../../../../../user-management/adapters/rest/dtos/TokenRequest';
import { ConfirmRentalRequest } from '../../../../domain/usecases/confirm-rental-request/ConfirmRentalRequest';
import { RentalRequestExpiredError } from '../../../../domain/usecases/confirm-rental-request/errors/RentalRequestExpiredError';
import { RentalRequestNotFoundError } from '../../../../domain/usecases/confirm-rental-request/errors/RentalRequestNotFoundError';
import { ListOwnerRentalRequests } from '../../../../domain/usecases/list-owner-rental-requests/ListOwnerRentalRequests';
import { ListRenterRentalRequests } from '../../../../domain/usecases/list-renter-rental-requests/ListRenterRentalRequests';
import { RequestRental } from '../../../../domain/usecases/request-rental/RequestRental';
import { RentalRequestMapper } from '../../../mappers/RentalRequestMapper';
import { GetRentalRequestResponseDto } from '../../dtos/GetRentalRequestResponseDto';
import { RequestRentalSchema } from '../../dtos/RequestRentalSchema';

@Controller('rental-request')
export class RentalRequestController {
  constructor(
    private readonly requestRentalUseCase: RequestRental,
    private readonly confirmRentalRequestUseCase: ConfirmRentalRequest,
    private readonly listRenterRentalRequestsUseCase: ListRenterRentalRequests,
    private readonly listOwnerRentalRequestsUseCase: ListOwnerRentalRequests,
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

  @Post()
  @UseGuards(AuthGuard)
  public async requestRental(
    @Req() req: TokenRequest,
    @Body() body: unknown,
  ): Promise<void> {
    try {
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
      });

      if (Either.isLeft(result))
        throw new HttpException(
          result.left.message,
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
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
        if (error instanceof RentalRequestExpiredError)
          throw new HttpException(error.message, HttpStatus.CONFLICT);
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
}
