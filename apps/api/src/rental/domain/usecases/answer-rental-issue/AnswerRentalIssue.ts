import { Either } from 'effect/index';

import { UnknownError } from '../../../../shared/error/errors/UnknownError';
import { Notification } from '../../../../shared/notification-outbox/domain/entities/Notification';
import { NotificationOutbox } from '../../../../shared/notification-outbox/domain/ports/NotificationOutbox';
import { UnitOfWork } from '../../../../shared/unit-of-work/UnitOfWork';
import { UseCase } from '../../../../shared/use-case/UseCase';
import { checkOwnerReply, isAnswerable } from '../../entities/RentalIssue';
import { InvalidIssueMessageError } from '../../errors/InvalidIssueMessageError';
import { RentalRequestNotFoundError } from '../../errors/RentalRequestNotFoundError';
import { RentalIssueRepository } from '../../ports/RentalIssueRepository';
import { RentalIssueNotAnswerableError } from './errors/RentalIssueNotAnswerableError';

interface Props {
  requestId: string;
  ownerId: string;
  reply: string;
  answeredAt: Date;
}

type Failure =
  | RentalRequestNotFoundError
  | RentalIssueNotAnswerableError
  | InvalidIssueMessageError
  | UnknownError;

/**
 * Le loueur répond une fois à la réclamation ouverte sur sa place — le bon
 * code du portail, la place qu'il a libérée. Le conducteur en est prévenu, et
 * Bookparking lit les deux versions avant de trancher.
 */
export class AnswerRentalIssue implements UseCase<
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
      if (context === null || context.ownerId !== props.ownerId)
        return Either.left(new RentalRequestNotFoundError());

      const issue = context.issue;
      if (issue === null || !isAnswerable(issue))
        return Either.left(new RentalIssueNotAnswerableError());

      const reply = checkOwnerReply(props.reply);
      if (Either.isLeft(reply)) return Either.left(reply.left);

      const recorded = await this.unitOfWork.process(async (trx) => {
        if (
          !(await this.rentalIssueRepository.recordOwnerReply(
            issue.id,
            reply.right,
            props.answeredAt,
            trx,
          ))
        )
          return false;
        await this.notificationOutbox.notify(
          Notification.about({
            kind: 'RENTAL_ISSUE_ANSWERED',
            recipientId: context.renterId,
            rentalRequestId: context.requestId,
            createdAt: props.answeredAt,
          }),
          trx,
        );
        return true;
      });
      if (!recorded) return Either.left(new RentalIssueNotAnswerableError());

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
