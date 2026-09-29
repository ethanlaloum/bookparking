import { Either } from 'effect/index';

import { UnknownError } from '../../../../shared/error/errors/UnknownError';
import { NotificationOutbox } from '../../../../shared/notification-outbox/domain/ports/NotificationOutbox';
import { UnitOfWork } from '../../../../shared/unit-of-work/UnitOfWork';
import { UseCase } from '../../../../shared/use-case/UseCase';
import { unpaidAbandonDeadlineAt } from '../../entities/RentalMoney';
import { PaymentUnavailableError } from '../../errors/PaymentUnavailableError';
import { PaymentGateway } from '../../ports/PaymentGateway';
import { RentalIssueRepository } from '../../ports/RentalIssueRepository';
import { RentalRepository } from '../../ports/RentalRepository';
import { expireLapsedRequests } from '../../services/expireLapsedRequests';
import { settleMoneyOwed } from '../../services/settleMoneyOwed';

interface Props {
  now: Date;
}

export interface SweepReport {
  abandoned: number;
  expired: number;
  settled: number;
  stillOwed: number;
}

export class SweepRentalRequests implements UseCase<
  Props,
  Promise<Either.Either<SweepReport, UnknownError>>
> {
  constructor(
    private readonly rentalRepository: RentalRepository,
    private readonly paymentGateway: PaymentGateway,
    private readonly notificationOutbox: NotificationOutbox,
    private readonly unitOfWork: UnitOfWork,
    private readonly rentalIssueRepository: RentalIssueRepository,
  ) {}

  // Les dettes sont relues après les expirations, dans le même passage : une
  // empreinte qui vient d'expirer est levée tout de suite, pas cinq minutes
  // plus tard. Une dette que Stripe n'éteint pas reste écrite et revient au
  // passage suivant, avec la même clé d'idempotence.
  public async execute(
    props: Props,
  ): Promise<Either.Either<SweepReport, UnknownError>> {
    try {
      const abandoned = await this.rentalRepository.abandonUnpaidRequestsSince(
        unpaidAbandonDeadlineAt(props.now),
      );
      const expired = await expireLapsedRequests(
        props.now,
        this.rentalRepository,
        this.notificationOutbox,
        this.unitOfWork,
      );

      let settled = 0;
      let stillOwed = 0;
      for (const owed of await this.rentalRepository.findMoneyOwed()) {
        const settlement = await settleMoneyOwed(
          owed,
          this.rentalRepository,
          this.paymentGateway,
          props.now,
        );
        if (settlement === 'SETTLED') settled += 1;
        else stillOwed += 1;
      }

      // Les remboursements partiels décidés sur une réclamation : même clé à
      // chaque passage, jusqu'à ce que Stripe réponde.
      for (const due of await this.rentalIssueRepository.findRefundsDue()) {
        try {
          const { refundId } = await this.paymentGateway.refund(
            due.paymentId,
            `issue-refund-${due.requestId}`,
            due.amountInCents,
          );
          await this.rentalIssueRepository.markRefunded(due.issueId, refundId);
          settled += 1;
        } catch (error: unknown) {
          if (!(error instanceof PaymentUnavailableError)) throw error;
          stillOwed += 1;
        }
      }

      return Either.right({ abandoned, expired, settled, stillOwed });
    } catch (error: unknown) {
      return Either.left(
        new UnknownError(
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
  }
}
