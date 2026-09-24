import { Either } from 'effect/index';

import { UnknownError } from '../../../../shared/error/errors/UnknownError';
import { InMemoryRentalRepository } from '../../../adapters/repositories/rental/InMemoryRentalRepository';
import { RentalRequest } from '../../entities/RentalRequest';
import { RentalRequestView } from '../../ports/RentalRepository';
import { ListOwnerRentalRequests } from '../list-owner-rental-requests/ListOwnerRentalRequests';
import { ListRenterRentalRequests } from './ListRenterRentalRequests';

const PRICING = {
  dayInCents: 1500,
  weekInCents: null,
  monthInCents: null,
};

const REQUESTED_AT = new Date('2026-10-01T09:00:00.000Z');

interface Arrangement {
  ownerId: string;
  renterId: string;
  address: string;
  box: string;
  from: string;
  to: string;
}

export const createListRentalRequestsSUT = () => {
  const rentalRepository = new InMemoryRentalRepository();
  const listRenterRentalRequests = new ListRenterRentalRequests(
    rentalRepository,
  );
  const listOwnerRentalRequests = new ListOwnerRentalRequests(rentalRepository);

  const context = {
    rentalRepository,
    listRenterRentalRequests,
    listOwnerRentalRequests,
  };

  const arrange = async (
    arrangement: Arrangement,
    paid: 'before-payments' | 'awaiting-payment' = 'before-payments',
  ): Promise<string> => {
    const request = RentalRequest.request({
      renterId: arrangement.renterId,
      address: arrangement.address,
      box: arrangement.box,
      days: { from: arrangement.from, to: arrangement.to },
      pricing: PRICING,
      requestedAt: REQUESTED_AT,
    });
    if (Either.isLeft(request))
      throw new Error('failed to arrange a pending request');

    await context.rentalRepository.createRequest(request.right);
    if (paid === 'before-payments')
      context.rentalRepository.placeWithoutPayment(request.right.id);
    context.rentalRepository.ownerIdByRequestId.set(
      request.right.id,
      arrangement.ownerId,
    );
    context.rentalRepository.placeByRequestId.set(request.right.id, {
      listingId: `listing-${arrangement.box}`,
      address: arrangement.address,
      box: arrangement.box,
    });
    return request.right.id;
  };

  return {
    context,

    async givenPendingRequest(arrangement: Arrangement): Promise<string> {
      return arrange(arrangement);
    },

    async givenRequestAwaitingPayment(
      arrangement: Arrangement,
    ): Promise<string> {
      return arrange(arrangement, 'awaiting-payment');
    },

    async givenConfirmedRequest(arrangement: Arrangement): Promise<string> {
      const id = await arrange(arrangement);
      await context.rentalRepository.confirmRequest(
        id,
        new Date('2026-10-02T09:00:00.000Z'),
      );
      return id;
    },

    givenRentalRepositoryFailsToRead() {
      context.rentalRepository.findAllForOwner = () => {
        throw new Error('rental repository is unreachable');
      };
      context.rentalRepository.findAllByRenter = () => {
        throw new Error('rental repository is unreachable');
      };
    },

    async whenListingAsRenter(renterId: string) {
      return context.listRenterRentalRequests.execute({ renterId });
    },

    async whenListingAsOwner(ownerId: string) {
      return context.listOwnerRentalRequests.execute({ ownerId });
    },

    thenRequestedPlacesAre(
      result: Either.Either<RentalRequestView[], unknown>,
      expected: { address: string; box: string }[],
    ) {
      expect(Either.isRight(result)).toEqual(true);
      if (!Either.isRight(result)) return;
      expect(
        result.right.map((view) => ({ address: view.address, box: view.box })),
      ).toEqual(expected);
    },

    thenStatusesAre(
      result: Either.Either<RentalRequestView[], unknown>,
      expected: string[],
    ) {
      expect(Either.isRight(result)).toEqual(true);
      if (!Either.isRight(result)) return;
      expect(result.right.map((view) => view.status)).toEqual(expected);
    },

    thenPricesInCentsAre(
      result: Either.Either<RentalRequestView[], unknown>,
      expected: number[],
    ) {
      expect(Either.isRight(result)).toEqual(true);
      if (!Either.isRight(result)) return;
      expect(result.right.map((view) => view.priceInCents)).toEqual(expected);
    },

    thenResultIsAnUnknownError(result: Either.Either<unknown, unknown>) {
      expect(Either.isLeft(result)).toEqual(true);
      if (Either.isLeft(result))
        expect(result.left).toBeInstanceOf(UnknownError);
    },
  };
};
