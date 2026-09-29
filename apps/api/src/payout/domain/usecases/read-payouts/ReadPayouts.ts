import { Either } from 'effect/index';

import { UnknownError } from '../../../../shared/error/errors/UnknownError';
import { PlatformSettingsReader } from '../../../../shared/platform-settings/domain/ports/PlatformSettingsReader';
import { UseCase } from '../../../../shared/use-case/UseCase';
import {
  ownerPayoutStatusOf,
  OwnerPayoutStatus,
  ownerShareOf,
  releaseAtOf,
} from '../../entities/OwnerPayout';
import {
  PayoutAccount,
  payoutAccountStatusOf,
  PayoutAccountStatus,
} from '../../entities/PayoutAccount';
import { PayoutUnavailableError } from '../../errors/PayoutUnavailableError';
import { PayoutProvider } from '../../ports/PayoutProvider';
import { PayoutRepository } from '../../ports/PayoutRepository';

interface Props {
  accountId: string;
  now: Date;
}

export interface PayoutLine {
  requestId: string;
  address: string;
  box: string;
  fromDay: string;
  toDay: string;
  priceInCents: number;
  amountInCents: number;
  status: OwnerPayoutStatus;
  releaseAt: Date;
  transferredAt: Date | null;
}

export interface PayoutSummary {
  accountStatus: PayoutAccountStatus;
  // Les conditions du jour, pour les locations à venir : chaque location déjà
  // faite garde les siennes, figées à la demande.
  feePercent: number;
  releaseDelayHours: number;
  upcomingInCents: number;
  sentInCents: number;
  payouts: PayoutLine[];
}

/**
 * Ce que le loueur voit de ses versements : l'état de son compte Stripe, puis
 * chaque location payée — retenue, libérée, virée. Un compte pas encore validé
 * est relu chez Stripe : le loueur qui revient de son inscription la voit
 * aboutie sans attendre le balayage. Stripe muet, l'état connu suffit.
 */
export class ReadPayouts implements UseCase<
  Props,
  Promise<Either.Either<PayoutSummary, UnknownError>>
> {
  constructor(
    private readonly payoutRepository: PayoutRepository,
    private readonly payoutProvider: PayoutProvider,
    private readonly platformSettingsReader: PlatformSettingsReader,
  ) {}

  public async execute(
    props: Props,
  ): Promise<Either.Either<PayoutSummary, UnknownError>> {
    try {
      const account = await this.refreshed(
        await this.payoutRepository.findAccount(props.accountId),
        props.now,
      );
      const accountStatus = payoutAccountStatusOf(account);
      const { platformFeePercent, payoutReleaseDelayHours } =
        await this.platformSettingsReader.current();
      const views = await this.payoutRepository.findPayoutsForOwner(
        props.accountId,
      );
      const payouts = views
        .map((view) => ({
          requestId: view.requestId,
          address: view.address,
          box: view.box,
          fromDay: view.fromDay,
          toDay: view.toDay,
          priceInCents: view.priceInCents,
          amountInCents:
            view.transferredAmountInCents ??
            ownerShareOf(
              view.priceInCents,
              view.platformFeeInCents,
              platformFeePercent,
              view.refundInCents,
            ),
          status: ownerPayoutStatusOf(view, props.now, accountStatus),
          releaseAt: releaseAtOf(
            view.startsAt,
            view.arrivedAt,
            view.releaseDelayInHours,
          ),
          transferredAt: view.transferredAt,
        }))
        .sort((a, b) => b.releaseAt.getTime() - a.releaseAt.getTime());
      const total = (sent: boolean) =>
        payouts
          .filter((payout) => (payout.status === 'SENT') === sent)
          .reduce((sum, payout) => sum + payout.amountInCents, 0);
      return Either.right({
        accountStatus,
        feePercent: platformFeePercent,
        releaseDelayHours: payoutReleaseDelayHours,
        upcomingInCents: total(false),
        sentInCents: total(true),
        payouts,
      });
    } catch (error: unknown) {
      return Either.left(
        new UnknownError(
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
  }

  private async refreshed(
    account: PayoutAccount | null,
    now: Date,
  ): Promise<PayoutAccount | null> {
    if (account === null || account.payoutsEnabled) return account;
    try {
      if (!(await this.payoutProvider.payoutsEnabled(account.stripeAccountId)))
        return account;
    } catch (error: unknown) {
      if (error instanceof PayoutUnavailableError) return account;
      throw error;
    }
    await this.payoutRepository.setPayoutsEnabled(account.accountId, true, now);
    return { ...account, payoutsEnabled: true };
  }
}
