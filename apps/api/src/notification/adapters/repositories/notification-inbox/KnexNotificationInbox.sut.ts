import { Either } from 'effect/index';

import { getTestDbConnection } from '../../../../infra/testcontainers-setup';
import { KnexListingRepository } from '../../../../listing/adapters/repositories/listing/KnexListingRepository';
import { ListingBuilder } from '../../../../listing/domain/builders/ListingBuilder';
import { KnexRentalRequestRepository } from '../../../../rental/adapters/repositories/rental-request/KnexRentalRequestRepository';
import { RentalRequest } from '../../../../rental/domain/entities/RentalRequest';
import { InMemoryEmailOutbox } from '../../../../shared/email-outbox/adapters/repositories/InMemoryEmailOutbox';
import {
  Notification,
  NotificationKind,
} from '../../../../shared/notification-outbox/domain/entities/Notification';
import { KnexNotificationOutbox } from '../../../../shared/notification-outbox/adapters/repositories/KnexNotificationOutbox';
import { KnexNotificationInbox } from './KnexNotificationInbox';

const BARLA = { address: '12 rue Barla, 06300 Nice', box: 'B12' };

// Écrit par la vraie file, lu par la vraie cloche : l'adresse et le box ne sont
// que sur `listings`, les jours que sur `rental_requests`.
export const createKnexNotificationInboxSUT = () => {
  const connection = getTestDbConnection();
  const outbox = new KnexNotificationOutbox(
    connection,
    new InMemoryEmailOutbox(),
  );
  const inbox = new KnexNotificationInbox(connection);

  return {
    async givenLeaRequestOnMarcPlace(): Promise<string> {
      await new KnexListingRepository(connection).create(
        new ListingBuilder()
          .withOwnerId('account-marc')
          .withAddress(BARLA.address)
          .withBox(BARLA.box)
          .withAvailability({
            from: new Date('2026-10-01T00:00:00.000Z'),
            to: new Date('2026-12-31T00:00:00.000Z'),
          })
          .build(),
      );
      const request = RentalRequest.request({
        renterId: 'account-lea',
        ...BARLA,
        days: { from: '2026-10-10', to: '2026-10-12' },
        pricing: { dayInCents: 1500, weekInCents: null, monthInCents: null },
        requestedAt: new Date('2026-10-01T07:00:00.000Z'),
      });
      if (Either.isLeft(request)) throw new Error('arrange failed');
      await new KnexRentalRequestRepository(connection).createRequest(
        request.right,
      );
      return request.right.id;
    },

    async givenNotified(
      requestId: string,
      recipientId: string,
      kind: NotificationKind,
      at: string,
    ): Promise<string> {
      const notification = Notification.about({
        kind,
        recipientId,
        rentalRequestId: requestId,
        createdAt: new Date(at),
      });
      await outbox.notify(notification);
      return notification.id;
    },

    async givenReadAt(notificationId: string, at: string) {
      await connection('notifications')
        .where({ id: notificationId })
        .update({ read_at: new Date(at) });
    },

    async whenReadingTheLatestFor(recipientId: string, limit = 30) {
      return inbox.findLatestFor(recipientId, limit);
    },

    async whenCountingUnreadFor(recipientId: string) {
      return inbox.countUnreadFor(recipientId);
    },

    async whenMarkingOneReadFor(
      recipientId: string,
      notificationId: string,
      at: string,
    ) {
      await inbox.markReadFor(recipientId, notificationId, new Date(at));
    },

    async whenMarkingAllReadFor(recipientId: string, at: string) {
      await inbox.markAllReadFor(recipientId, new Date(at));
    },

    async thenReadAtAre(expected: Record<string, string | null>) {
      const rows = (await connection('notifications').select(
        'id',
        'read_at',
      )) as { id: string; read_at: Date | null }[];
      expect(
        Object.fromEntries(
          rows.map((row) => [row.id, row.read_at?.toISOString() ?? null]),
        ),
      ).toEqual(expected);
    },
  };
};
