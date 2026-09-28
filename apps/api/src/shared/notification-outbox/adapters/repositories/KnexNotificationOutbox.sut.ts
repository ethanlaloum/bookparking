import { Either } from 'effect/index';

import { getTestDbConnection } from '../../../../infra/testcontainers-setup';
import { KnexListingRepository } from '../../../../listing/adapters/repositories/listing/KnexListingRepository';
import { ListingBuilder } from '../../../../listing/domain/builders/ListingBuilder';
import { KnexRentalRequestRepository } from '../../../../rental/adapters/repositories/rental-request/KnexRentalRequestRepository';
import { RentalRequest } from '../../../../rental/domain/entities/RentalRequest';
import { KnexEmailOutbox } from '../../../email-outbox/adapters/repositories/KnexEmailOutbox';
import { KnexUnitOfWork } from '../../../unit-of-work/KnexUnitOfWork';
import {
  Notification,
  NotificationKind,
} from '../../domain/entities/Notification';
import { KnexNotificationOutbox } from './KnexNotificationOutbox';

const BARLA = { address: '12 rue Barla, 06300 Nice', box: '12' };
const LATER_WRITE_FAILURE = 'a later write of the same transaction fails';

// Ce SUT, exclu du build, pose une vraie annonce et une vraie demande : la
// notification référence `rental_requests` par clé étrangère.
export const createKnexNotificationOutboxSUT = () => {
  const connection = getTestDbConnection();
  const outbox = new KnexNotificationOutbox(
    connection,
    new KnexEmailOutbox(connection),
  );
  const unitOfWork = new KnexUnitOfWork(connection);

  const noticeOf = (
    requestId: string,
    recipientId: string,
    kind: NotificationKind = 'RENTAL_REQUEST_RECEIVED',
  ) =>
    Notification.about({
      kind,
      recipientId,
      rentalRequestId: requestId,
      createdAt: new Date('2026-10-01T07:05:00.000Z'),
    });

  return {
    async givenAccount(email: string): Promise<string> {
      const [row] = (await connection('accounts')
        .insert({
          email,
          password_hash: 'stub-password-hash',
          registered_at: new Date('2026-09-01T09:00:00.000Z'),
        })
        .returning('id')) as { id: string }[];
      return row.id;
    },

    async givenRequestOnMarcPlace(ownerId: string, renterId: string) {
      await new KnexListingRepository(connection).create(
        new ListingBuilder()
          .withOwnerId(ownerId)
          .withAddress(BARLA.address)
          .withBox(BARLA.box)
          .withAvailability({
            from: new Date('2026-10-01T00:00:00.000Z'),
            to: new Date('2026-12-31T00:00:00.000Z'),
          })
          .build(),
      );
      const request = RentalRequest.request({
        renterId,
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

    async whenNotifying(
      requestId: string,
      recipientId: string,
      kind?: NotificationKind,
    ) {
      await outbox.notify(noticeOf(requestId, recipientId, kind));
    },

    async whenNotifyingInATransactionThatFails(
      requestId: string,
      recipientId: string,
    ): Promise<unknown> {
      return unitOfWork
        .process(async (trx) => {
          await outbox.notify(noticeOf(requestId, recipientId), trx);
          throw new Error(LATER_WRITE_FAILURE);
        })
        .then(
          () => null,
          (error: unknown) => error,
        );
    },

    thenTheTransactionFailedOnItsLaterWrite(failure: unknown) {
      expect((failure as Error).message).toEqual(LATER_WRITE_FAILURE);
    },

    async thenNotificationRowsAre(
      expected: { kind: string; recipientId: string; requestId: string }[],
    ) {
      const rows = await connection('notifications')
        .orderBy('kind')
        .select('kind', 'recipient_id', 'rental_request_id', 'read_at');
      expect(rows).toEqual(
        expected.map((row) => ({
          kind: row.kind,
          recipient_id: row.recipientId,
          rental_request_id: row.requestId,
          read_at: null,
        })),
      );
    },

    async thenQueuedEmailsAre(expected: { kind: string; recipient: string }[]) {
      const rows = await connection('outgoing_emails')
        .orderBy('kind')
        .select('kind', 'recipient', 'status', 'queued_at');
      expect(rows).toEqual(
        expected.map((row) => ({
          ...row,
          status: 'PENDING',
          queued_at: new Date('2026-10-01T07:05:00.000Z'),
        })),
      );
    },
  };
};
