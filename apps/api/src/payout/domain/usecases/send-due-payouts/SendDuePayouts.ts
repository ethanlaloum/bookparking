import { Either } from 'effect/index';

import { UnknownError } from '../../../../shared/error/errors/UnknownError';
import { Notification } from '../../../../shared/notification-outbox/domain/entities/Notification';
import { NotificationOutbox } from '../../../../shared/notification-outbox/domain/ports/NotificationOutbox';
import { UnitOfWork } from '../../../../shared/unit-of-work/UnitOfWork';
import { UseCase } from '../../../../shared/use-case/UseCase';
import { ownerShareOf } from '../../entities/OwnerPayout';
import { PayoutAccount } from '../../entities/PayoutAccount';
import { PayoutUnavailableError } from '../../errors/PayoutUnavailableError';
import { PayoutProvider } from '../../ports/PayoutProvider';
import { DuePayout, PayoutRepository } from '../../ports/PayoutRepository';

interface Props {
  now: Date;
}

export interface PayoutSweepReport {
  sent: number;
  awaitingAccount: number;
  refused: number;
}

const PAYOUTS_PER_SWEEP = 50;

// Une clé par demande, jamais par tentative : un virement rejoué après une
// réponse perdue rend le premier au lieu d'en faire un second.
export const transferIdempotencyKeyOf = (requestId: string): string =>
  `transfer-${requestId}`;

/**
 * Vire au loueur l'argent libéré (D-22) : prix payé moins la commission figée
 * à la demande, vers son compte Stripe Connect, un virement au plus par
 * demande. Un loueur sans compte prêt attend — son compte est relu chez
 * Stripe à chaque passage, pour partir dès qu'il est validé. Une panne de
 * Stripe arrête le passage ; un refus sur une demande n'arrête que celle-ci,
 * qui revient au passage suivant.
 */
export class SendDuePayouts implements UseCase<
  Props,
  Promise<Either.Either<PayoutSweepReport, UnknownError>>
> {
  constructor(
    private readonly payoutRepository: PayoutRepository,
    private readonly payoutProvider: PayoutProvider,
    private readonly notificationOutbox: NotificationOutbox,
    private readonly unitOfWork: UnitOfWork,
    private readonly releaseDelayInHours: number,
    private readonly currentFeePercent: number,
  ) {}

  public async execute(
    props: Props,
  ): Promise<Either.Either<PayoutSweepReport, UnknownError>> {
    const report: PayoutSweepReport = {
      sent: 0,
      awaitingAccount: 0,
      refused: 0,
    };
    const checked = new Map<string, boolean>();
    try {
      const due = await this.payoutRepository.findDuePayouts(
        props.now,
        this.releaseDelayInHours,
        PAYOUTS_PER_SWEEP,
      );
      for (const payout of due) {
        const account = await this.readyAccountOf(payout, checked, props.now);
        if (account === null) {
          report.awaitingAccount += 1;
          continue;
        }
        const amountInCents = ownerShareOf(
          payout.priceInCents,
          payout.platformFeeInCents,
          this.currentFeePercent,
        );
        let stripeTransferId: string;
        try {
          stripeTransferId = await this.payoutProvider.transfer({
            stripeAccountId: account.stripeAccountId,
            amountInCents,
            paymentId: payout.paymentId,
            requestId: payout.requestId,
            idempotencyKey: transferIdempotencyKeyOf(payout.requestId),
          });
        } catch (error: unknown) {
          if (error instanceof PayoutUnavailableError) throw error;
          report.refused += 1;
          continue;
        }
        await this.unitOfWork.process(async (trx) => {
          await this.payoutRepository.recordTransfer(
            {
              requestId: payout.requestId,
              ownerId: payout.ownerId,
              amountInCents,
              stripeTransferId,
              transferredAt: props.now,
            },
            trx,
          );
          await this.notificationOutbox.notify(
            Notification.about({
              kind: 'RENTAL_PAYOUT_SENT',
              recipientId: payout.ownerId,
              rentalRequestId: payout.requestId,
              createdAt: props.now,
            }),
            trx,
          );
        });
        report.sent += 1;
      }
      return Either.right(report);
    } catch (error: unknown) {
      if (error instanceof PayoutUnavailableError) return Either.right(report);
      return Either.left(
        new UnknownError(
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
  }

  // Relu chez Stripe une fois par passage et par compte : un loueur qui vient
  // de finir son inscription est payé sans attendre qu'il revienne sur le site.
  private async readyAccountOf(
    payout: DuePayout,
    checked: Map<string, boolean>,
    now: Date,
  ): Promise<PayoutAccount | null> {
    const account = payout.account;
    if (account === null) return null;
    if (account.payoutsEnabled) return account;
    let enabled = checked.get(account.stripeAccountId);
    if (enabled === undefined) {
      enabled = await this.payoutProvider.payoutsEnabled(
        account.stripeAccountId,
      );
      checked.set(account.stripeAccountId, enabled);
      if (enabled)
        await this.payoutRepository.setPayoutsEnabled(
          account.accountId,
          true,
          now,
        );
    }
    return enabled ? { ...account, payoutsEnabled: true } : null;
  }
}
