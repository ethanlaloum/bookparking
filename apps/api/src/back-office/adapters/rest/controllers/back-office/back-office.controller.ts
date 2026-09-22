import {
  Body,
  Controller,
  Delete,
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
import { TokenRequest } from '../../../../../user-management/adapters/rest/dtos/TokenRequest';
import { AuthGuard } from '../../../../../user-management/adapters/rest/guards/auth.guard';
import { MissingModerationReasonError } from '../../../../domain/errors/MissingModerationReasonError';
import { ModerationTargetNotFoundError } from '../../../../domain/errors/ModerationTargetNotFoundError';
import { NotABackOfficeAdminError } from '../../../../domain/errors/NotABackOfficeAdminError';
import { CancelRentalRequest } from '../../../../domain/usecases/cancel-rental-request/CancelRentalRequest';
import { LiftAccountSuspension } from '../../../../domain/usecases/lift-account-suspension/LiftAccountSuspension';
import { ListAccounts } from '../../../../domain/usecases/list-accounts/ListAccounts';
import { ListAllListings } from '../../../../domain/usecases/list-listings/ListAllListings';
import { ListAllRentalRequests } from '../../../../domain/usecases/list-rental-requests/ListAllRentalRequests';
import { ReadOverview } from '../../../../domain/usecases/read-overview/ReadOverview';
import { SuspendAccount } from '../../../../domain/usecases/suspend-account/SuspendAccount';
import { UnpublishAnyListing } from '../../../../domain/usecases/unpublish-any-listing/UnpublishAnyListing';
import { BackOfficeMapper } from '../../../mappers/BackOfficeMapper';
import {
  AdminAccountResponseDto,
  AdminListingResponseDto,
  AdminRentalRequestResponseDto,
  OverviewResponseDto,
} from '../../dtos/BackOfficeResponseDtos';
import { ModerationSchema } from '../../dtos/ModerationSchema';
import { AdminGuard } from '../../guards/admin.guard';

type ModerationUseCase = {
  execute(props: {
    adminAccountId: string;
    targetId: string;
    reason: string;
    actedAt: Date;
  }): Promise<Either.Either<void, Error>>;
};

@Controller('admin')
@UseGuards(AuthGuard, AdminGuard)
export class BackOfficeController {
  constructor(
    private readonly readOverviewUseCase: ReadOverview,
    private readonly listAccountsUseCase: ListAccounts,
    private readonly listAllListingsUseCase: ListAllListings,
    private readonly listAllRentalRequestsUseCase: ListAllRentalRequests,
    private readonly unpublishAnyListingUseCase: UnpublishAnyListing,
    private readonly suspendAccountUseCase: SuspendAccount,
    private readonly liftAccountSuspensionUseCase: LiftAccountSuspension,
    private readonly cancelRentalRequestUseCase: CancelRentalRequest,
  ) {}

  /**
   * Ne rend rien, et c'est tout son objet : la classe porte déjà
   * `AdminGuard`, donc atteindre ce corps vide *est* la réponse. Le site
   * public s'en sert pour savoir s'il doit offrir ses onglets
   * d'administration — une seule lecture indexée de `back_office_admins`,
   * relue à chaque appel, plutôt qu'un drapeau dans le jeton qui survivrait à
   * une révocation.
   */
  @Get('access')
  @HttpCode(HttpStatus.NO_CONTENT)
  public confirmAccess(): void {
    return;
  }

  @Get('overview')
  public async readOverview(
    @Req() req: TokenRequest,
  ): Promise<OverviewResponseDto> {
    const result = await this.readOverviewUseCase.execute({
      adminAccountId: req.user.id,
      now: new Date(),
    });
    if (Either.isLeft(result)) throw BackOfficeController.toHttp(result.left);
    return result.right;
  }

  @Get('accounts')
  public async listAccounts(
    @Req() req: TokenRequest,
  ): Promise<AdminAccountResponseDto[]> {
    const result = await this.listAccountsUseCase.execute({
      adminAccountId: req.user.id,
    });
    if (Either.isLeft(result)) throw BackOfficeController.toHttp(result.left);
    return result.right.map((view) => BackOfficeMapper.toAccountDto(view));
  }

  @Get('listings')
  public async listListings(
    @Req() req: TokenRequest,
  ): Promise<AdminListingResponseDto[]> {
    const result = await this.listAllListingsUseCase.execute({
      adminAccountId: req.user.id,
    });
    if (Either.isLeft(result)) throw BackOfficeController.toHttp(result.left);
    return result.right.map((view) => BackOfficeMapper.toListingDto(view));
  }

  @Get('rental-requests')
  public async listRentalRequests(
    @Req() req: TokenRequest,
  ): Promise<AdminRentalRequestResponseDto[]> {
    const result = await this.listAllRentalRequestsUseCase.execute({
      adminAccountId: req.user.id,
    });
    if (Either.isLeft(result)) throw BackOfficeController.toHttp(result.left);
    return result.right.map((view) =>
      BackOfficeMapper.toRentalRequestDto(view),
    );
  }

  @Post('listings/:id/unpublish')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async unpublishListing(
    @Req() req: TokenRequest,
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<void> {
    await this.moderate(
      this.unpublishAnyListingUseCase,
      req,
      id,
      body,
      'unpublishListing',
    );
  }

  @Post('accounts/:id/suspension')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async suspendAccount(
    @Req() req: TokenRequest,
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<void> {
    await this.moderate(
      this.suspendAccountUseCase,
      req,
      id,
      body,
      'suspendAccount',
    );
  }

  @Delete('accounts/:id/suspension')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async liftSuspension(
    @Req() req: TokenRequest,
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<void> {
    await this.moderate(
      this.liftAccountSuspensionUseCase,
      req,
      id,
      body,
      'liftSuspension',
    );
  }

  @Post('rental-requests/:id/cancellation')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async cancelRentalRequest(
    @Req() req: TokenRequest,
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<void> {
    await this.moderate(
      this.cancelRentalRequestUseCase,
      req,
      id,
      body,
      'cancelRentalRequest',
    );
  }

  // Les quatre actions de modération ont la même forme : un identifiant, un
  // motif, et la même échelle de refus. Les écrire quatre fois inviterait une
  // divergence entre elles.
  private async moderate(
    useCase: ModerationUseCase,
    req: TokenRequest,
    targetId: string,
    body: unknown,
    method: string,
  ): Promise<void> {
    try {
      const decodeId = Schema.decodeUnknownEither(Schema.UUID)(targetId);
      if (Either.isLeft(decodeId))
        throw new HttpException(
          new ModerationTargetNotFoundError().message,
          HttpStatus.NOT_FOUND,
        );

      const decodeBody = Schema.decodeUnknownEither(ModerationSchema)(body);
      if (Either.isLeft(decodeBody))
        throw new HttpException(
          parseSchemaError(decodeBody.left),
          HttpStatus.BAD_REQUEST,
        );

      const result = await useCase.execute({
        adminAccountId: req.user.id,
        targetId: decodeId.right,
        reason: decodeBody.right.reason,
        actedAt: new Date(),
      });

      if (Either.isLeft(result)) throw BackOfficeController.toHttp(result.left);
    } catch (error: unknown) {
      controllerErrorHandler(error, {
        name: 'BackOfficeController',
        method,
        userId: req.user.id,
      });
    }
  }

  private static toHttp(error: Error): HttpException {
    if (error instanceof NotABackOfficeAdminError)
      return new HttpException(error.message, HttpStatus.FORBIDDEN);
    if (error instanceof MissingModerationReasonError)
      return new HttpException(error.message, HttpStatus.BAD_REQUEST);
    if (error instanceof ModerationTargetNotFoundError)
      return new HttpException(error.message, HttpStatus.NOT_FOUND);
    return new HttpException(
      "L'action d'administration a échoué",
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
