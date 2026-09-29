import { Either } from 'effect/index';

import { UnknownError } from '../../../../shared/error/errors/UnknownError';
import { Notification } from '../../../../shared/notification-outbox/domain/entities/Notification';
import { NotificationOutbox } from '../../../../shared/notification-outbox/domain/ports/NotificationOutbox';
import { UnitOfWork } from '../../../../shared/unit-of-work/UnitOfWork';
import { UseCase } from '../../../../shared/use-case/UseCase';
import {
  RentalIssueReason,
  reportIssue,
  reportRefusalOf,
} from '../../entities/RentalIssue';
import { InvalidIssueMessageError } from '../../errors/InvalidIssueMessageError';
import { RentalRequestNotFoundError } from '../../errors/RentalRequestNotFoundError';
import { RentalIssueRepository } from '../../ports/RentalIssueRepository';
import { RentalIssueNotReportableError } from './errors/RentalIssueNotReportableError';

interface Props {
  requestId: string;
  renterId: string;
  reason: RentalIssueReason;
  message: string | null;
  reportedAt: Date;
}

type Failure =
  | RentalRequestNotFoundError
  | RentalIssueNotReportableError
  | InvalidIssueMessageError
  | UnknownError;

/**
 * Le conducteur signale qu'il ne peut pas entrer, ou que la place est
 * occupée. La réclamation gèle l'argent du loueur — aucun virement ne part
 * tant qu'elle est ouverte — et le loueur en est prévenu dans la même
 * transaction, pour qu'il puisse répondre avant que Bookparking tranche.
 * Seul le conducteur de la réservation peut se plaindre : pour tout autre
 * compte, la réservation n'existe pas.
 */
export class ReportRentalIssue implements UseCase<
  Props,
  Promise<Either.Either<void, Failure>>
> {
  constructor(
    private readonly rentalIssueRepository: RentalIssueRepository,
    private readonly notificationOutbox: NotificationOutbox,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  public async execute(props: Props): Promise<Either.Either<void, Failure>> {
    try {
      const context = await this.rentalIssueRepository.findContext(
        props.requestId,
      );
      if (context === null || context.renterId !== props.renterId)
        return Either.left(new RentalRequestNotFoundError());

      const refusal = reportRefusalOf(context, props.reportedAt);
      if (refusal !== null)
        return Either.left(new RentalIssueNotReportableError(refusal));

      const issue = reportIssue({
        requestId: context.requestId,
        reason: props.reason,
        message: props.message,
        reportedAt: props.reportedAt,
      });
      if (Either.isLeft(issue)) return Either.left(issue.left);

      const created = await this.unitOfWork.process(async (trx) => {
        if (!(await this.rentalIssueRepository.create(issue.right, trx)))
          return false;
        await this.notificationOutbox.notify(
          Notification.about({
            kind: 'RENTAL_ISSUE_REPORTED',
            recipientId: context.ownerId,
            rentalRequestId: context.requestId,
            createdAt: props.reportedAt,
          }),
          trx,
        );
        return true;
      });
      if (!created)
        return Either.left(
          new RentalIssueNotReportableError('ALREADY_REPORTED'),
        );

      return Either.right(undefined);
    } catch (error: unknown) {
      return Either.left(
        new UnknownError(
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
  }
}
