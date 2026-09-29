import { Either } from 'effect/index';

import { UnknownError } from '../../../../shared/error/errors/UnknownError';
import { Notification } from '../../../../shared/notification-outbox/domain/entities/Notification';
import { NotificationOutbox } from '../../../../shared/notification-outbox/domain/ports/NotificationOutbox';
import { UnitOfWork } from '../../../../shared/unit-of-work/UnitOfWork';
import { UseCase } from '../../../../shared/use-case/UseCase';
import {
  AdminActionKind,
  AdminTargetType,
  isUsableReason,
} from '../../entities/AdminAction';
import { MissingModerationReasonError } from '../../errors/MissingModerationReasonError';
import { ModerationTargetNotFoundError } from '../../errors/ModerationTargetNotFoundError';
import { NotABackOfficeAdminError } from '../../errors/NotABackOfficeAdminError';
import {
  BackOfficeRepository,
  IssueResolution,
  IssueToResolve,
} from '../../ports/BackOfficeRepository';
import { InvalidRefundAmountError } from './errors/InvalidRefundAmountError';
import { RentalIssueAlreadyResolvedError } from './errors/RentalIssueAlreadyResolvedError';
import { RentalNoLongerRefundableError } from './errors/RentalNoLongerRefundableError';

export type IssueDecision = 'REFUND' | 'PARTIAL_REFUND' | 'DISMISS';

interface Props {
  adminAccountId: string;
  issueId: string;
  decision: IssueDecision;
  refundInCents: number | null;
  reason: string;
  actedAt: Date;
}

type Failure =
  | NotABackOfficeAdminError
  | MissingModerationReasonError
  | ModerationTargetNotFoundError
  | RentalIssueAlreadyResolvedError
  | RentalNoLongerRefundableError
  | InvalidRefundAmountError
  | UnknownError;

// Une annulation qui ne trouve plus rien à annuler défait la transaction :
// la réclamation ne doit pas se dire remboursée sans que l'argent soit dû.
class NothingLeftToCancel extends Error {}

/**
 * Bookparking tranche une réclamation, et l'argent gelé repart :
 * - rembourser en totalité annule la réservation, comme l'annulation par
 *   l'exploitant — le balayage de `rental` rend tout au conducteur ;
 * - rembourser en partie rend une somme prise sur la part du loueur, qui
 *   touche le reste à la libération ;
 * - classer sans suite rend l'argent au loueur, à la date prévue.
 *
 * Mêmes gardes et même journal que la modération ; les deux parties sont
 * prévenues dans la transaction qui écrit la décision.
 */
export class ResolveRentalIssue implements UseCase<
  Props,
  Promise<Either.Either<void, Failure>>
> {
  constructor(
    private readonly backOfficeRepository: BackOfficeRepository,
    private readonly notificationOutbox: NotificationOutbox,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  public async execute(props: Props): Promise<Either.Either<void, Failure>> {
    try {
      if (!(await this.backOfficeRepository.isAdmin(props.adminAccountId)))
        return Either.left(new NotABackOfficeAdminError());

      if (!isUsableReason(props.reason))
        return Either.left(new MissingModerationReasonError());

      const issue = await this.backOfficeRepository.findIssueToResolve(
        props.issueId,
      );
      if (issue === null)
        return Either.left(new ModerationTargetNotFoundError());
      if (issue.status !== 'OPEN')
        return Either.left(new RentalIssueAlreadyResolvedError());

      const resolution = ResolveRentalIssue.resolutionOf(issue, props);
      if (Either.isLeft(resolution)) return Either.left(resolution.left);

      const outcome = await this.unitOfWork
        .process(async (trx) => {
          if (
            !(await this.backOfficeRepository.resolveRentalIssue(
              issue.issueId,
              resolution.right,
              trx,
            ))
          )
            return 'ALREADY_RESOLVED' as const;
          if (
            resolution.right.status === 'REFUNDED' &&
            (await this.backOfficeRepository.cancelRentalRequest(
              issue.requestId,
              trx,
            )) === null
          )
            throw new NothingLeftToCancel();

          await this.backOfficeRepository.recordAction(
            {
              adminAccountId: props.adminAccountId,
              kind: AdminActionKind.RESOLVE_RENTAL_ISSUE,
              targetType: AdminTargetType.RENTAL_REQUEST,
              targetId: issue.requestId,
              reason: resolution.right.reason,
              actedAt: props.actedAt,
            },
            trx,
          );
          for (const recipientId of [issue.renterId, issue.ownerId])
            await this.notificationOutbox.notify(
              Notification.about({
                kind: 'RENTAL_ISSUE_RESOLVED',
                recipientId,
                rentalRequestId: issue.requestId,
                createdAt: props.actedAt,
              }),
              trx,
            );
          return 'RESOLVED' as const;
        })
        .catch((error: unknown) => {
          if (error instanceof NothingLeftToCancel)
            return 'NOT_REFUNDABLE' as const;
          throw error;
        });

      if (outcome === 'ALREADY_RESOLVED')
        return Either.left(new RentalIssueAlreadyResolvedError());
      if (outcome === 'NOT_REFUNDABLE')
        return Either.left(new RentalNoLongerRefundableError());
      return Either.right(undefined);
    } catch (error: unknown) {
      return Either.left(
        new UnknownError(
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
  }

  // Un remboursement partiel se prend sur la part du loueur, et lui en laisse
  // au moins un centime : au-delà, c'est un remboursement total, qui rend
  // aussi la commission.
  private static resolutionOf(
    issue: IssueToResolve,
    props: Props,
  ): Either.Either<IssueResolution, InvalidRefundAmountError> {
    const common = {
      resolvedAt: props.actedAt,
      resolvedBy: props.adminAccountId,
      reason: props.reason.trim(),
    };
    if (props.decision === 'DISMISS')
      return Either.right({
        ...common,
        status: 'DISMISSED',
        refundInCents: null,
      });
    if (props.decision === 'REFUND')
      return Either.right({
        ...common,
        status: 'REFUNDED',
        refundInCents: issue.priceInCents,
      });

    const maximum = issue.ownerShareInCents - 1;
    const amount = props.refundInCents;
    if (
      amount === null ||
      !Number.isInteger(amount) ||
      amount < 1 ||
      amount > maximum
    )
      return Either.left(new InvalidRefundAmountError(maximum));
    return Either.right({
      ...common,
      status: 'PARTIALLY_REFUNDED',
      refundInCents: amount,
    });
  }
}
