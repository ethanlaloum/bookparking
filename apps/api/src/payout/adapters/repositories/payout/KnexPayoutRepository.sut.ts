import { Either } from 'effect/index';

import { getTestDbConnection } from '../../../../infra/testcontainers-setup';
import { KnexListingRepository } from '../../../../listing/adapters/repositories/listing/KnexListingRepository';
import { ListingBuilder } from '../../../../listing/domain/builders/ListingBuilder';
import { KnexRentalRequestRepository } from '../../../../rental/adapters/repositories/rental-request/KnexRentalRequestRepository';
import { RentalRequest } from '../../../../rental/domain/entities/RentalRequest';
import { KnexPayoutRepository } from './KnexPayoutRepository';

const MARC = 'account-marc';

// Ce SUT, exclu du build, pose de vraies demandes par le vrai dépôt de
// `rental/` : l'argent n'est dû que s'il a été prélevé, et c'est ce dépôt-là
// qui l'écrit.
export const createKnexPayoutRepositorySUT = () => {
  const connection = getTestDbConnection();
  const rentals = new KnexRentalRequestRepository(connection);
  const repository = new KnexPayoutRepository(connection);
  let listed = false;

  const request = async (
    days: {
      from: string;
      to: string;
    },
    payoutReleaseDelayHours?: number,
  ): Promise<string> => {
    if (!listed) {
      await new KnexListingRepository(connection).create(
        new ListingBuilder()
          .withOwnerId(MARC)
          .withAddress('12 rue Barla, 06300 Nice')
          .withBox('B12')
          .withAvailability({
            from: new Date('2026-10-01T00:00:00.000Z'),
            to: new Date('2026-12-31T00:00:00.000Z'),
          })
          .build(),
      );
      listed = true;
    }
    const created = RentalRequest.request({
      renterId: 'account-lea',
      address: '12 rue Barla, 06300 Nice',
      box: 'B12',
      days,
      pricing: { dayInCents: 1500, weekInCents: null, monthInCents: null },
      requestedAt: new Date('2026-10-01T07:00:00.000Z'),
      platformFeePercent: 15,
      payoutReleaseDelayHours,
    });
    if (Either.isLeft(created)) throw new Error('arrange failed');
    await rentals.createRequest(created.right);
    await rentals.markHoldPlaced(
      created.right.id,
      `pi_${created.right.id}`,
      new Date('2026-10-01T07:05:00.000Z'),
    );
    return created.right.id;
  };

  return {
    marc: MARC,
    repository,

    async givenCapturedRental(
      days: {
        from: string;
        to: string;
      },
      payoutReleaseDelayHours?: number,
    ): Promise<string> {
      const id = await request(days, payoutReleaseDelayHours);
      await rentals.confirmRequest(id, new Date('2026-10-02T09:00:00.000Z'));
      return id;
    },

    async givenHeldRequest(days: {
      from: string;
      to: string;
    }): Promise<string> {
      return request(days);
    },

    async givenIssue(
      requestId: string,
      status: 'OPEN' | 'PARTIALLY_REFUNDED',
      refundInCents: number | null,
    ) {
      await connection('rental_issues').insert({
        id: `${requestId.slice(0, 24)}ffffffffffff`,
        rental_request_id: requestId,
        reason: 'PLACE_OCCUPIED',
        reported_at: new Date('2026-10-10T08:00:00.000Z'),
        status,
        refund_in_cents: refundInCents,
      });
    },

    async givenArrived(requestId: string, at: string) {
      await rentals.markArrived(requestId, new Date(at));
    },

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

    async whenReadingDueAt(now: string) {
      return repository.findDuePayouts(new Date(now), 50);
    },
  };
};
