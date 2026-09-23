import { Either } from 'effect/index';

import { getTestDbConnection } from '../../../../infra/testcontainers-setup';
import { KnexListingRepository } from '../../../../listing/adapters/repositories/listing/KnexListingRepository';
import { ListingBuilder } from '../../../../listing/domain/builders/ListingBuilder';
import { KnexRentalRequestRepository } from '../../../../rental/adapters/repositories/rental-request/KnexRentalRequestRepository';
import { RentalRequest } from '../../../../rental/domain/entities/RentalRequest';
import { KnexBackOfficeRepository } from './KnexBackOfficeRepository';

const BARLA = { address: '12 rue Barla, 06300 Nice', box: '12' };

// Le contexte `back-office` n'importe rien de `rental/` ni de `listing/` dans
// le code livré ; ce SUT, exclu du build, s'en sert pour poser une vraie
// demande dans l'état voulu avant de l'annuler.
export const createKnexBackOfficeRepositorySUT = () => {
  const connection = getTestDbConnection();
  const rentals = new KnexRentalRequestRepository(connection);

  const arrangeRequest = async (): Promise<string> => {
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
    await rentals.createRequest(request.right);
    return request.right.id;
  };

  return {
    async givenLeaRequestWithHoldPlaced(): Promise<string> {
      const id = await arrangeRequest();
      await rentals.markHoldPlaced(
        id,
        'pi_lea',
        new Date('2026-10-01T07:05:00.000Z'),
      );
      return id;
    },

    async givenLeaRequestConfirmedAndCaptured(): Promise<string> {
      const id = await this.givenLeaRequestWithHoldPlaced();
      await rentals.confirmRequest(id, new Date('2026-10-02T16:00:00.000Z'));
      return id;
    },

    async givenLeaRequestConfirmedBeforePayments(): Promise<string> {
      const id = await arrangeRequest();
      await connection('rental_requests')
        .where({ id })
        .update({ status: 'CONFIRMED', confirmed_at: new Date() });
      return id;
    },

    async whenTheOperatorCancels(requestId: string) {
      return new KnexBackOfficeRepository(connection).cancelRentalRequest(
        requestId,
      );
    },

    async thenStoredRowIs(
      requestId: string,
      expected: { status: string; money: string },
    ) {
      const rows = await connection('rental_requests')
        .where({ id: requestId })
        .select('status', 'money_status');
      expect(rows).toEqual([
        { status: expected.status, money_status: expected.money },
      ]);
    },
  };
};
