import { randomUUID } from 'node:crypto';

import { Either } from 'effect/index';

import { getTestDbConnection } from '../../../../infra/testcontainers-setup';
import { KnexListingRepository } from '../../../../listing/adapters/repositories/listing/KnexListingRepository';
import { ListingBuilder } from '../../../../listing/domain/builders/ListingBuilder';
import { KnexRentalRequestRepository } from '../../../../rental/adapters/repositories/rental-request/KnexRentalRequestRepository';
import { RentalRequest } from '../../../../rental/domain/entities/RentalRequest';
import { KnexAccountFootprint } from './KnexAccountFootprint';

export const MARC = { id: 'account-marc', email: 'marc.d@example.com' };
export const LEA = { id: 'account-lea', email: 'lea.t@example.com' };
export const PAUL = { id: 'account-paul', email: 'paul.r@example.com' };

const PLACES = {
  [MARC.id]: { address: '12 rue Barla, 06300 Nice', box: '12' },
  [PAUL.id]: { address: '3 rue Droite, 06300 Nice', box: '4' },
};

// Le contexte `user-management` n'importe rien de `rental/` ni de `listing/`
// dans le code livré ; ce SUT, exclu du build, s'en sert pour poser de vraies
// annonces et de vraies demandes dans l'état voulu.
export const createKnexAccountFootprintSUT = () => {
  const connection = getTestDbConnection();
  const rentals = new KnexRentalRequestRepository(connection);
  const footprint = new KnexAccountFootprint(connection);

  return {
    async givenActiveListingOf(ownerId: string): Promise<string> {
      const listing = new ListingBuilder()
        .withOwnerId(ownerId)
        .withAddress(PLACES[ownerId].address)
        .withBox(PLACES[ownerId].box)
        .build();
      await new KnexListingRepository(connection).create(listing);
      return listing.toState().id;
    },

    async givenUnpaidRequest(
      renterId: string,
      ownerId: string,
      days: { from: string; to: string },
    ): Promise<string> {
      const request = RentalRequest.request({
        renterId,
        ...PLACES[ownerId],
        days,
        pricing: { dayInCents: 1500, weekInCents: null, monthInCents: null },
        requestedAt: new Date('2026-10-01T07:00:00.000Z'),
      });
      if (Either.isLeft(request)) throw new Error('arrange failed');
      await rentals.createRequest(request.right);
      return request.right.id;
    },

    async givenHoldPlaced(requestId: string) {
      await rentals.markHoldPlaced(
        requestId,
        `pi_${requestId}`,
        new Date('2026-10-01T07:05:00.000Z'),
      );
    },

    async givenConfirmedAndCaptured(requestId: string) {
      await this.givenHoldPlaced(requestId);
      await rentals.confirmRequest(
        requestId,
        new Date('2026-10-02T16:00:00.000Z'),
      );
    },

    async givenConfirmedBeforePayments(requestId: string) {
      await connection('rental_requests')
        .where({ id: requestId })
        .update({ status: 'CONFIRMED', confirmed_at: new Date() });
    },

    async givenTransferRecorded(requestId: string, ownerId: string) {
      await connection('owner_transfers').insert({
        rental_request_id: requestId,
        owner_id: ownerId,
        amount_in_cents: 3825,
        stripe_transfer_id: `tr_${requestId}`,
        transferred_at: new Date('2026-10-13T08:00:00.000Z'),
      });
    },

    async givenNotificationFor(recipientId: string, requestId: string) {
      await connection('notifications').insert({
        id: randomUUID(),
        kind: 'RENTAL_REQUEST_RECEIVED',
        recipient_id: recipientId,
        rental_request_id: requestId,
        created_at: new Date('2026-10-01T07:05:00.000Z'),
        pushed_at: null,
      });
    },

    async givenPushDevice(token: string, accountId: string) {
      await connection('push_devices').insert({
        token,
        account_id: accountId,
        registered_at: new Date('2026-09-20T09:00:00.000Z'),
      });
    },

    async givenEmailTo(recipient: string, status: 'PENDING' | 'SENT') {
      await connection('outgoing_emails').insert({
        id: randomUUID(),
        kind: 'WELCOME',
        recipient,
        status,
        queued_at: new Date('2026-09-20T09:00:00.000Z'),
        sent_at:
          status === 'SENT' ? new Date('2026-09-20T09:01:00.000Z') : null,
      });
    },

    async givenPayoutAccount(accountId: string) {
      await connection('payout_accounts').insert({
        account_id: accountId,
        stripe_account_id: `acct_${accountId}`,
        payouts_enabled: true,
        created_at: new Date('2026-09-25T09:00:00.000Z'),
        updated_at: new Date('2026-09-25T09:00:00.000Z'),
      });
    },

    async givenListingPhoto(ownerId: string) {
      const id = randomUUID();
      await connection('listing_photos').insert({
        id,
        owner_id: ownerId,
        format: 'image/jpeg',
        bytes: Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
        uploaded_at: new Date('2026-09-20T09:00:00.000Z'),
      });
      return id;
    },

    async whenCheckingCommitmentsAt(now: Date) {
      return {
        marc: await footprint.hasOngoingCommitments(MARC.id, now),
        lea: await footprint.hasOngoingCommitments(LEA.id, now),
        paul: await footprint.hasOngoingCommitments(PAUL.id, now),
      };
    },

    async whenErasing(account: { id: string; email: string }) {
      await footprint.erase(account.id, account.email);
    },

    async thenRequestStatusesAre(expected: Record<string, string>) {
      const rows = (await connection('rental_requests')
        .whereIn('id', Object.keys(expected))
        .select('id', 'status')) as { id: string; status: string }[];
      expect(
        Object.fromEntries(rows.map((row) => [row.id, row.status])),
      ).toEqual(expected);
    },

    async thenListingStatusesAre(expected: Record<string, string>) {
      const rows = (await connection('listings')
        .whereIn('id', Object.keys(expected))
        .select('id', 'status')) as { id: string; status: string }[];
      expect(
        Object.fromEntries(rows.map((row) => [row.id, row.status])),
      ).toEqual(expected);
    },

    async thenRemainingRowsAre(expected: {
      notificationRecipients: string[];
      pushTokens: string[];
      emailRecipients: string[];
      payoutAccounts: string[];
      photoOwners: string[];
    }) {
      const column = async (table: string, name: string) =>
        (
          (await connection(table).orderBy(name).select(name)) as Record<
            string,
            string
          >[]
        ).map((row) => row[name]);
      expect({
        notificationRecipients: await column('notifications', 'recipient_id'),
        pushTokens: await column('push_devices', 'token'),
        emailRecipients: await column('outgoing_emails', 'recipient'),
        payoutAccounts: await column('payout_accounts', 'account_id'),
        photoOwners: await column('listing_photos', 'owner_id'),
      }).toEqual(expected);
    },
  };
};
