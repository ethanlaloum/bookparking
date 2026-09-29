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
import { InvalidPlatformSettingsError } from '../../../../../shared/platform-settings/domain/errors/InvalidPlatformSettingsError';
import { TokenRequest } from '../../../../../user-management/adapters/rest/dtos/TokenRequest';
import { AuthGuard } from '../../../../../user-management/adapters/rest/guards/auth.guard';
import { MissingModerationReasonError } from '../../../../domain/errors/MissingModerationReasonError';
import { ModerationTargetNotFoundError } from '../../../../domain/errors/ModerationTargetNotFoundError';
import { NotABackOfficeAdminError } from '../../../../domain/errors/NotABackOfficeAdminError';
import { PlatformSettingsUnchangedError } from '../../../../domain/errors/PlatformSettingsUnchangedError';
import { CancelRentalRequest } from '../../../../domain/usecases/cancel-rental-request/CancelRentalRequest';
import { LiftAccountSuspension } from '../../../../domain/usecases/lift-account-suspension/LiftAccountSuspension';
import { ListAccounts } from '../../../../domain/usecases/list-accounts/ListAccounts';
import { ListAllListings } from '../../../../domain/usecases/list-listings/ListAllListings';
import { ChangePlatformSettings } from '../../../../domain/usecases/change-platform-settings/ChangePlatformSettings';
import { ListRentalIssues } from '../../../../domain/usecases/list-rental-issues/ListRentalIssues';
import { InvalidRefundAmountError } from '../../../../domain/usecases/resolve-rental-issue/errors/InvalidRefundAmountError';
import { RentalIssueAlreadyResolvedError } from '../../../../domain/usecases/resolve-rental-issue/errors/RentalIssueAlreadyResolvedError';
import { RentalNoLongerRefundableError } from '../../../../domain/usecases/resolve-rental-issue/errors/RentalNoLongerRefundableError';
import { ResolveRentalIssue } from '../../../../domain/usecases/resolve-rental-issue/ResolveRentalIssue';
import { ListAllRentalRequests } from '../../../../domain/usecases/list-rental-requests/ListAllRentalRequests';
import { ReadAdminJournal } from '../../../../domain/usecases/read-admin-journal/ReadAdminJournal';
import { ReadPlatformSettings } from '../../../../domain/usecases/read-platform-settings/ReadPlatformSettings';
import { ReadOverview } from '../../../../domain/usecases/read-overview/ReadOverview';
import { SuspendAccount } from '../../../../domain/usecases/suspend-account/SuspendAccount';
import { UnpublishAnyListing } from '../../../../domain/usecases/unpublish-any-listing/UnpublishAnyListing';
import { BackOfficeMapper } from '../../../mappers/BackOfficeMapper';
import {
  AdminAccountResponseDto,
  AdminJournalEntryResponseDto,
  AdminListingResponseDto,
  AdminRentalIssueResponseDto,
  AdminRentalRequestResponseDto,
  OverviewResponseDto,
  PlatformSettingsFormResponseDto,
} from '../../dtos/BackOfficeResponseDtos';
import { ChangePlatformSettingsSchema } from '../../dtos/ChangePlatformSettingsSchema';
import { ModerationSchema } from '../../dtos/ModerationSchema';
import { ResolveRentalIssueSchema } from '../../dtos/ResolveRentalIssueSchema';
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
    private readonly readPlatformSettingsUseCase: ReadPlatformSettings,
    private readonly changePlatformSettingsUseCase: ChangePlatformSettings,
    private readonly readAdminJournalUseCase: ReadAdminJournal,
    private readonly listRentalIssuesUseCase: ListRentalIssues,
    private readonly resolveRentalIssueUseCase: ResolveRentalIssue,
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

  @Get('settings')
  public async readSettings(
    @Req() req: TokenRequest,
  ): Promise<PlatformSettingsFormResponseDto> {
    const result = await this.readPlatformSettingsUseCase.execute({
      adminAccountId: req.user.id,
    });
    if (Either.isLeft(result)) throw BackOfficeController.toHttp(result.left);
    return result.right;
  }

  // POST et non PUT : chaque changement écrit une nouvelle version, la
  // précédente reste lisible dans le journal.
  @Post('settings')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async changeSettings(
    @Req() req: TokenRequest,
    @Body() body: unknown,
  ): Promise<void> {
    try {
      const decoded = Schema.decodeUnknownEither(ChangePlatformSettingsSchema)(
        body,
      );
      if (Either.isLeft(decoded))
        throw new HttpException(
          parseSchemaError(decoded.left),
          HttpStatus.BAD_REQUEST,
        );

      const { reason, ...settings } = decoded.right;
      const result = await this.changePlatformSettingsUseCase.execute({
        adminAccountId: req.user.id,
        settings,
        reason,
        actedAt: new Date(),
      });
      if (Either.isLeft(result)) throw BackOfficeController.toHttp(result.left);
    } catch (error: unknown) {
      controllerErrorHandler(error, {
        name: 'BackOfficeController',
        method: 'changeSettings',
        userId: req.user.id,
      });
    }
  }

  @Get('journal')
  public async readJournal(
    @Req() req: TokenRequest,
  ): Promise<AdminJournalEntryResponseDto[]> {
    const result = await this.readAdminJournalUseCase.execute({
      adminAccountId: req.user.id,
    });
    if (Either.isLeft(result)) throw BackOfficeController.toHttp(result.left);
    return result.right.map((entry) =>
      BackOfficeMapper.toJournalEntryDto(entry),
    );
  }

  @Get('issues')
  public async listIssues(
    @Req() req: TokenRequest,
  ): Promise<AdminRentalIssueResponseDto[]> {
    const result = await this.listRentalIssuesUseCase.execute({
      adminAccountId: req.user.id,
    });
    if (Either.isLeft(result)) throw BackOfficeController.toHttp(result.left);
    return result.right.map((view) => BackOfficeMapper.toRentalIssueDto(view));
  }

  @Post('issues/:id/resolution')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async resolveIssue(
    @Req() req: TokenRequest,
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<void> {
    try {
      const decodeId = Schema.decodeUnknownEither(Schema.UUID)(id);
      if (Either.isLeft(decodeId))
        throw new HttpException(
          new ModerationTargetNotFoundError().message,
          HttpStatus.NOT_FOUND,
        );
      const decoded = Schema.decodeUnknownEither(ResolveRentalIssueSchema)(
        body,
      );
      if (Either.isLeft(decoded))
        throw new HttpException(
          parseSchemaError(decoded.left),
          HttpStatus.BAD_REQUEST,
        );

      const result = await this.resolveRentalIssueUseCase.execute({
        adminAccountId: req.user.id,
        issueId: decodeId.right,
        decision: decoded.right.decision,
        refundInCents: decoded.right.refundInCents ?? null,
        reason: decoded.right.reason,
        actedAt: new Date(),
      });
      if (Either.isLeft(result)) throw BackOfficeController.toHttp(result.left);
    } catch (error: unknown) {
      controllerErrorHandler(error, {
        name: 'BackOfficeController',
        method: 'resolveIssue',
        userId: req.user.id,
      });
    }
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
    if (
      error instanceof InvalidPlatformSettingsError ||
      error instanceof PlatformSettingsUnchangedError ||
      error instanceof InvalidRefundAmountError
    )
      return new HttpException(error.message, HttpStatus.BAD_REQUEST);
    if (
      error instanceof RentalIssueAlreadyResolvedError ||
      error instanceof RentalNoLongerRefundableError
    )
      return new HttpException(error.message, HttpStatus.CONFLICT);
    return new HttpException(
      "L'action d'administration a échoué",
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
