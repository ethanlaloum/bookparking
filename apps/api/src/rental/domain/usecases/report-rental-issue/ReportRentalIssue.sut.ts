import { Either } from 'effect/index';

import { InMemoryNotificationOutbox } from '../../../../shared/notification-outbox/adapters/repositories/InMemoryNotificationOutbox';
import { InMemoryUnitOfWork } from '../../../../shared/unit-of-work/InMemoryUnitOfWork';
import { InMemoryRentalIssueRepository } from '../../../adapters/repositories/rental-issue/InMemoryRentalIssueRepository';
import {
  RentalIssueReason,
  RentalIssueState,
} from '../../entities/RentalIssue';
import { IssueContext } from '../../ports/RentalIssueRepository';
import { AnswerRentalIssue } from '../answer-rental-issue/AnswerRentalIssue';
import { ReportRentalIssue } from './ReportRentalIssue';

export const LEA = 'account-lea';
export const MARC = 'account-marc';
export const REQUEST = 'request-lea';

// La location du 10/10/2026 au 12/10/2026, heure de Paris : du 09/10 22:00 UTC
// au 12/10 21:59:59.999 UTC. Payée, confirmée, pas encore commencée.
const A_CONFIRMED_RENTAL: Omit<IssueContext, 'issue' | 'hasIssue'> & {
  paymentId: string;
} = {
  requestId: REQUEST,
  renterId: LEA,
  ownerId: MARC,
  status: 'CONFIRMED',
  money: 'CAPTURED',
  startsAt: new Date('2026-10-09T22:00:00.000Z'),
  endsAt: new Date('2026-10-12T21:59:59.999Z'),
  arrivedAt: null,
  transferred: false,
  paymentId: 'pi_lea',
};

// Les deux cas d'usage de la réclamation côté parties : le conducteur la fait,
// le loueur y répond.
export const createRentalIssueSUT = () => {
  const repository = new InMemoryRentalIssueRepository();
  const notificationOutbox = new InMemoryNotificationOutbox();
  const report = new ReportRentalIssue(
    repository,
    notificationOutbox,
    new InMemoryUnitOfWork(),
  );
  const answer = new AnswerRentalIssue(
    repository,
    notificationOutbox,
    new InMemoryUnitOfWork(),
  );

  return {
    givenConfirmedRental(overrides: Partial<IssueContext> = {}) {
      repository.givenRental({ ...A_CONFIRMED_RENTAL, ...overrides });
    },

    async givenReported(at = '2026-10-10T08:00:00.000Z') {
      await report.execute({
        requestId: REQUEST,
        renterId: LEA,
        reason: 'NO_ACCESS',
        message: null,
        reportedAt: new Date(at),
      });
    },

    whenReporting(params: {
      by?: string;
      reason?: RentalIssueReason;
      message?: string | null;
      at?: string;
    }) {
      return report.execute({
        requestId: REQUEST,
        renterId: params.by ?? LEA,
        reason: params.reason ?? 'NO_ACCESS',
        message: params.message ?? null,
        reportedAt: new Date(params.at ?? '2026-10-10T08:00:00.000Z'),
      });
    },

    whenAnswering(params: { by?: string; reply: string; at?: string }) {
      return answer.execute({
        requestId: REQUEST,
        ownerId: params.by ?? MARC,
        reply: params.reply,
        answeredAt: new Date(params.at ?? '2026-10-10T08:30:00.000Z'),
      });
    },

    thenRefusedWith(
      result: Either.Either<unknown, Error>,
      expected: { name: string; message: string },
    ) {
      if (Either.isRight(result)) throw new Error('expected a refusal');
      expect({ name: result.left.name, message: result.left.message }).toEqual(
        expected,
      );
    },

    thenIssuesAre(expected: Omit<RentalIssueState, 'id'>[]) {
      expect(
        [...repository.issues.values()].map(({ id: _id, ...issue }) => issue),
      ).toEqual(expected);
    },

    thenNotificationsAre(
      expected: { kind: string; recipientId: string; requestId: string }[],
    ) {
      expect(notificationOutbox.sent()).toEqual(expected);
    },
  };
};
