import { Either } from 'effect/index';

import { getTestDbConnection } from '../../../../infra/testcontainers-setup';
import { KnexListingRepository } from '../../../../listing/adapters/repositories/listing/KnexListingRepository';
import { ListingBuilder } from '../../../../listing/domain/builders/ListingBuilder';
import { KnexRentalRequestRepository } from '../../../../rental/adapters/repositories/rental-request/KnexRentalRequestRepository';
import { RentalRequest } from '../../../../rental/domain/entities/RentalRequest';
import { InMemoryEmailOutbox } from '../../../../shared/email-outbox/adapters/repositories/InMemoryEmailOutbox';
import { KnexNotificationOutbox } from '../../../../shared/notification-outbox/adapters/repositories/KnexNotificationOutbox';
import {
  Notification,
  NotificationKind,
} from '../../../../shared/notification-outbox/domain/entities/Notification';
import { KnexPushDeviceRepository } from '../push-device/KnexPushDeviceRepository';
import { KnexPushQueue } from './KnexPushQueue';

const BARLA = { address: '12 rue Barla, 06300 Nice', box: 'B12' };

export const createKnexPushQueueSUT = () => {
  const connection = getTestDbConnection();
  const outbox = new KnexNotificationOutbox(
    connection,
    new InMemoryEmailOutbox(),
  );
  const devices = new KnexPushDeviceRepository(connection);
  const queue = new KnexPushQueue(connection);

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

    async givenPhone(accountId: string, token: string, at: string) {
      await devices.register(token, accountId, new Date(at));
    },

    async whenForgetting(tokens: string[]) {
      await devices.forget(tokens);
    },

    async whenReadingTheQueue(limit = 50) {
      return queue.findUnpushed(limit);
    },

    async whenMarkingPushed(ids: string[], at: string) {
      await queue.markPushed(ids, new Date(at));
    },

    async thenPhonesAre(expected: Record<string, string>) {
      const rows = (await connection('push_devices').select(
        'token',
        'account_id',
      )) as { token: string; account_id: string }[];
      expect(
        Object.fromEntries(rows.map((row) => [row.token, row.account_id])),
      ).toEqual(expected);
    },

    async thenPushedAtAre(expected: Record<string, string | null>) {
      const rows = (await connection('notifications').select(
        'id',
        'pushed_at',
      )) as { id: string; pushed_at: Date | null }[];
      expect(
        Object.fromEntries(
          rows.map((row) => [row.id, row.pushed_at?.toISOString() ?? null]),
        ),
      ).toEqual(expected);
    },
  };
};
