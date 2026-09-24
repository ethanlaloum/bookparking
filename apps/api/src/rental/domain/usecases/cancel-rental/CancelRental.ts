import { Either } from 'effect/index';

import { UnknownError } from '../../../../shared/error/errors/UnknownError';
import { UseCase } from '../../../../shared/use-case/UseCase';
import {
  CancellationOutcome,
  CancellingParty,
  moneyAfterCancellation,
  outcomeOfCancelledMoney,
} from '../../entities/RentalCancellation';
import { hasReachedTheOwner } from '../../entities/RentalMoney';
import { RentalRequestNotFoundError } from '../../errors/RentalRequestNotFoundError';
import { PaymentGateway } from '../../ports/PaymentGateway';
import {
  RentalRepository,
  RentalRequestSummary,
} from '../../ports/RentalRepository';
import { settleMoneyOwed } from '../../services/settleMoneyOwed';
import { RentalAlreadyStartedError } from './errors/RentalAlreadyStartedError';
import { RentalNotCancellableError } from './errors/RentalNotCancellableError';

interface Props {
  requestId: string;
  accountId: string;
  cancelledAt: Date;
}

type Failure =
  | RentalAlreadyStartedError
  | RentalNotCancellableError
  | RentalRequestNotFoundError
  | UnknownError;

export class CancelRental implements UseCase<
  Props,
  Promise<Either.Either<CancellationOutcome, Failure>>
> {
  constructor(
    private readonly rentalRepository: RentalRepository,
    private readonly paymentGateway: PaymentGateway,
    private readonly freeCancellationHours: number,
  ) {}

  public async execute(
    props: Props,
  ): Promise<Either.Either<CancellationOutcome, Failure>> {
    try {
      const summary = await this.rentalRepository.findRequestSummary(
        props.requestId,
      );
      const party = summary && CancelRental.partyOf(summary, props.accountId);
      if (!summary || !party)
        return Either.left(new RentalRequestNotFoundError());

      if (summary.status === 'CANCELLED')
        return Either.right(outcomeOfCancelledMoney(summary.money));
      if (summary.status !== 'PENDING' && summary.status !== 'CONFIRMED')
        return Either.left(new RentalNotCancellableError());
      if (props.cancelledAt.getTime() >= summary.startsAt.getTime())
        return Either.left(new RentalAlreadyStartedError());

      const after = moneyAfterCancellation({
        party,
        money: summary.money,
        cancelledAt: props.cancelledAt,
        freeCancellationUntil: this.freeCancellationUntilOf(summary),
      });

      const cancelled = await this.rentalRepository.markCancelledBy(
        summary.id,
        party,
        after.money,
        props.cancelledAt,
      );
      if (!cancelled) return this.afterConcurrentChange(summary.id);

      // L'argent est rendu aussitôt quand Stripe répond ; sinon la dette reste
      // écrite et le balayage la règle dans les cinq minutes.
      if (
        (after.money === 'RELEASE_DUE' || after.money === 'REFUND_DUE') &&
        summary.paymentId !== null
      )
        await settleMoneyOwed(
          {
            requestId: summary.id,
            paymentId: summary.paymentId,
            owed: after.money,
            status: 'CANCELLED',
          },
          this.rentalRepository,
          this.paymentGateway,
          props.cancelledAt,
        );

      return Either.right(after.outcome);
    } catch (error: unknown) {
      return Either.left(
        new UnknownError(
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
  }

  // Le conducteur d'abord : un compte qui louerait sa propre place annule
  // selon les règles du conducteur, les plus strictes. Le loueur ne peut
  // annuler qu'une demande qu'il a pu voir.
  private static partyOf(
    summary: RentalRequestSummary,
    accountId: string,
  ): CancellingParty | null {
    if (summary.renterId === accountId) return 'RENTER';
    if (summary.ownerId === accountId && hasReachedTheOwner(summary.status))
      return 'OWNER';
    return null;
  }

  // Une demande faite avant cette règle, sans échéance écrite, reçoit celle du
  // délai en vigueur ; toute autre garde celle figée à sa création.
  private freeCancellationUntilOf(summary: RentalRequestSummary): Date {
    return (
      summary.freeCancellationUntil ??
      new Date(
        summary.startsAt.getTime() -
          this.freeCancellationHours * 60 * 60 * 1000,
      )
    );
  }

  private async afterConcurrentChange(
    requestId: string,
  ): Promise<Either.Either<CancellationOutcome, Failure>> {
    const reread = await this.rentalRepository.findRequestSummary(requestId);
    if (reread?.status === 'CANCELLED')
      return Either.right(outcomeOfCancelledMoney(reread.money));
    return Either.left(new RentalNotCancellableError());
  }
}
