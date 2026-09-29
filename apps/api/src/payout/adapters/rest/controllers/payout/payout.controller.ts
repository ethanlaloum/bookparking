import {
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Either } from 'effect/index';

import { controllerErrorHandler } from '../../../../../shared/error/controllerErrorHandler';
import { TokenRequest } from '../../../../../user-management/adapters/rest/dtos/TokenRequest';
import { AuthGuard } from '../../../../../user-management/adapters/rest/guards/auth.guard';
import { PayoutAccountNotReadyError } from '../../../../domain/errors/PayoutAccountNotReadyError';
import { PayoutUnavailableError } from '../../../../domain/errors/PayoutUnavailableError';
import { OpenPayoutDashboard } from '../../../../domain/usecases/open-payout-dashboard/OpenPayoutDashboard';
import { ReadPayouts } from '../../../../domain/usecases/read-payouts/ReadPayouts';
import { StartPayoutOnboarding } from '../../../../domain/usecases/start-payout-onboarding/StartPayoutOnboarding';
import {
  PayoutSummaryResponseDto,
  StripeLinkResponseDto,
} from '../../dtos/PayoutSummaryResponseDto';

// Les trois routes sont clées sur le compte du jeton : un loueur ne lit et
// n'ouvre que ses propres versements.
@Controller('payout')
export class PayoutController {
  constructor(
    private readonly readPayoutsUseCase: ReadPayouts,
    private readonly startPayoutOnboardingUseCase: StartPayoutOnboarding,
    private readonly openPayoutDashboardUseCase: OpenPayoutDashboard,
  ) {}

  @Get()
  @UseGuards(AuthGuard)
  public async read(
    @Req() req: TokenRequest,
  ): Promise<PayoutSummaryResponseDto | void> {
    try {
      const result = await this.readPayoutsUseCase.execute({
        accountId: req.user.id,
        now: new Date(),
      });
      if (Either.isLeft(result))
        throw new HttpException(
          'Vos versements sont indisponibles',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      const summary = result.right;
      return {
        accountStatus: summary.accountStatus,
        feePercent: summary.feePercent,
        releaseDelayHours: summary.releaseDelayHours,
        upcomingInCents: summary.upcomingInCents,
        sentInCents: summary.sentInCents,
        payouts: summary.payouts.map((payout) => ({
          requestId: payout.requestId,
          address: payout.address,
          box: payout.box,
          fromDay: payout.fromDay,
          toDay: payout.toDay,
          priceInCents: payout.priceInCents,
          amountInCents: payout.amountInCents,
          status: payout.status,
          releaseAt: payout.releaseAt.toISOString(),
          transferredAt:
            payout.transferredAt === null
              ? null
              : payout.transferredAt.toISOString(),
        })),
      };
    } catch (error: unknown) {
      controllerErrorHandler(error, {
        name: 'PayoutController',
        method: 'read',
        userId: req.user.id,
      });
    }
  }

  // Un lien neuf à chaque appel : Stripe n'en garde un que quelques minutes.
  @Post('onboarding')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  public async startOnboarding(
    @Req() req: TokenRequest,
  ): Promise<StripeLinkResponseDto | void> {
    try {
      const result = await this.startPayoutOnboardingUseCase.execute({
        accountId: req.user.id,
        now: new Date(),
      });
      if (Either.isLeft(result)) throw PayoutController.failureOf(result.left);
      return { url: result.right };
    } catch (error: unknown) {
      controllerErrorHandler(error, {
        name: 'PayoutController',
        method: 'startOnboarding',
        userId: req.user.id,
      });
    }
  }

  @Post('dashboard')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  public async openDashboard(
    @Req() req: TokenRequest,
  ): Promise<StripeLinkResponseDto | void> {
    try {
      const result = await this.openPayoutDashboardUseCase.execute({
        accountId: req.user.id,
      });
      if (Either.isLeft(result)) throw PayoutController.failureOf(result.left);
      return { url: result.right };
    } catch (error: unknown) {
      controllerErrorHandler(error, {
        name: 'PayoutController',
        method: 'openDashboard',
        userId: req.user.id,
      });
    }
  }

  private static failureOf(error: Error): HttpException {
    if (error instanceof PayoutAccountNotReadyError)
      return new HttpException(error.message, HttpStatus.CONFLICT);
    if (error instanceof PayoutUnavailableError)
      return new HttpException(error.message, HttpStatus.SERVICE_UNAVAILABLE);
    return new HttpException(
      'Le service de versement a rencontré une erreur',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
