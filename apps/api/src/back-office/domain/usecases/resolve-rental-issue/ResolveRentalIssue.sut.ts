import { Either } from 'effect/index';

import { InMemoryNotificationOutbox } from '../../../../shared/notification-outbox/adapters/repositories/InMemoryNotificationOutbox';
import { InMemoryUnitOfWork } from '../../../../shared/unit-of-work/InMemoryUnitOfWork';
import { AdminAction } from '../../entities/AdminAction';
import {
  BackOfficeRepository,
  CancelledRentalParties,
  IssueResolution,
  IssueToResolve,
} from '../../ports/BackOfficeRepository';
import { IssueDecision, ResolveRentalIssue } from './ResolveRentalIssue';

const ADMIN = 'account-admin';
export const ISSUE = 'issue-1';
export const REQUEST = 'request-lea';

// 45,00 € payés, 6,75 € de commission : 38,25 € pour le loueur.
const AN_OPEN_ISSUE: IssueToResolve = {
  issueId: ISSUE,
  requestId: REQUEST,
  status: 'OPEN',
  priceInCents: 4500,
  ownerShareInCents: 3825,
  renterId: 'account-lea',
  ownerId: 'account-marc',
};

// Le dépôt du back-office n'a pas de doublure en mémoire : ce cas d'usage n'en
// lit que cinq méthodes, que ce faux tient à la main.
class FakeBackOfficeRepository {
  public admins = new Set<string>([ADMIN]);
  public issue: IssueToResolve | null = AN_OPEN_ISSUE;
  public cancellable = true;
  public resolutions: IssueResolution[] = [];
  public cancelled: string[] = [];
  public actions: AdminAction[] = [];

  public async isAdmin(accountId: string): Promise<boolean> {
    return this.admins.has(accountId);
  }

  public async findIssueToResolve(): Promise<IssueToResolve | null> {
    return this.issue;
  }

  public async resolveRentalIssue(
    _issueId: string,
    resolution: IssueResolution,
  ): Promise<boolean> {
    if (this.issue?.status !== 'OPEN') return false;
    this.resolutions.push(resolution);
    return true;
  }

  public async cancelRentalRequest(
    requestId: string,
  ): Promise<CancelledRentalParties | null> {
    if (!this.cancellable) return null;
    this.cancelled.push(requestId);
    return { renterId: 'account-lea', ownerId: 'account-marc' };
  }

  public async recordAction(action: AdminAction): Promise<void> {
    this.actions.push(action);
  }
}

export const createResolveRentalIssueSUT = () => {
  const repository = new FakeBackOfficeRepository();
  const notificationOutbox = new InMemoryNotificationOutbox();
  const resolve = new ResolveRentalIssue(
    repository as unknown as BackOfficeRepository,
    notificationOutbox,
    new InMemoryUnitOfWork(),
  );

  return {
    admin: ADMIN,

    givenIssueAlreadyResolved() {
      repository.issue = { ...AN_OPEN_ISSUE, status: 'DISMISSED' };
    },

    givenNoIssue() {
      repository.issue = null;
    },

    givenRentalAlreadyCancelled() {
      repository.cancellable = false;
    },

    whenResolving(params: {
      by?: string;
      decision: IssueDecision;
      refundInCents?: number | null;
      reason?: string;
    }) {
      return resolve.execute({
        adminAccountId: params.by ?? ADMIN,
        issueId: ISSUE,
        decision: params.decision,
        refundInCents: params.refundInCents ?? null,
        reason: params.reason ?? '  Photo de la place occupée reçue  ',
        actedAt: new Date('2026-10-10T10:00:00.000Z'),
      });
    },

    thenRefusedWith(
      result: Either.Either<unknown, Error>,
      expected: { name: string; message: string },
    ) {
      if (Either.isRight(result)) throw new Error('expected a refusal');
      expect({
        name: result.left.constructor.name,
        message: result.left.message,
      }).toEqual(expected);
    },

    thenWritten(expected: {
      resolutions: IssueResolution[];
      cancelled: string[];
      actions: AdminAction[];
    }) {
      expect({
        resolutions: repository.resolutions,
        cancelled: repository.cancelled,
        actions: repository.actions,
      }).toEqual(expected);
    },

    thenNotificationsAre(
      expected: { kind: string; recipientId: string; requestId: string }[],
    ) {
      expect(notificationOutbox.sent()).toEqual(expected);
    },
  };
};
