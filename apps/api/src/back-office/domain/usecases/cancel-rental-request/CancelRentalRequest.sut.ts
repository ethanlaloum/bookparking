import { Either } from 'effect/index';

import { InMemoryNotificationOutbox } from '../../../../shared/notification-outbox/adapters/repositories/InMemoryNotificationOutbox';
import { InMemoryUnitOfWork } from '../../../../shared/unit-of-work/InMemoryUnitOfWork';
import { AdminAction } from '../../entities/AdminAction';
import {
  BackOfficeRepository,
  CancelledRentalParties,
} from '../../ports/BackOfficeRepository';
import { CancelRentalRequest } from './CancelRentalRequest';

const ADMIN = 'account-admin';

// Le dépôt du back-office n'a pas de doublure en mémoire : ce cas d'usage n'en
// lit que trois méthodes, que ce faux tient à la main.
class FakeBackOfficeRepository {
  public admins = new Set<string>([ADMIN]);
  public cancellable = new Map<string, CancelledRentalParties>();
  public actions: AdminAction[] = [];

  public async isAdmin(accountId: string): Promise<boolean> {
    return this.admins.has(accountId);
  }

  public async cancelRentalRequest(
    requestId: string,
  ): Promise<CancelledRentalParties | null> {
    const parties = this.cancellable.get(requestId) ?? null;
    this.cancellable.delete(requestId);
    return parties;
  }

  public async recordAction(action: AdminAction): Promise<void> {
    this.actions.push(action);
  }
}

export const createCancelRentalRequestSUT = () => {
  const repository = new FakeBackOfficeRepository();
  const notificationOutbox = new InMemoryNotificationOutbox();
  const cancelRentalRequest = new CancelRentalRequest(
    repository as unknown as BackOfficeRepository,
    notificationOutbox,
    new InMemoryUnitOfWork(),
  );

  return {
    admin: ADMIN,

    givenRequestBetween(requestId: string, parties: CancelledRentalParties) {
      repository.cancellable.set(requestId, parties);
    },

    async whenCancelledBy(
      adminAccountId: string,
      requestId: string,
      at: string,
    ) {
      return cancelRentalRequest.execute({
        adminAccountId,
        targetId: requestId,
        reason: 'Place signalée inaccessible',
        actedAt: new Date(at),
      });
    },

    thenResultIsRight(result: Either.Either<unknown, unknown>) {
      expect(Either.isRight(result)).toEqual(true);
    },

    thenNotificationsAre(
      expected: { kind: string; recipientId: string; requestId: string }[],
    ) {
      expect(notificationOutbox.sent()).toEqual(expected);
    },

    thenNotificationsWereCreatedAt(at: string[]) {
      expect(
        notificationOutbox.notifications.map(
          (notification) => notification.createdAt,
        ),
      ).toEqual(at.map((instant) => new Date(instant)));
    },
  };
};
