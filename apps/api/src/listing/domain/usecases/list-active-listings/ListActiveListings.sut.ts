import { Either } from 'effect/index';

import { UnknownError } from '../../../../shared/error/errors/UnknownError';
import { InMemoryListingRepository } from '../../../adapters/repositories/listing/InMemoryListingRepository';
import { ListingBuilder } from '../../builders/ListingBuilder';
import { ListingStatus } from '../../entities/Listing';
import { ListActiveListings, ListedActiveListings } from './ListActiveListings';

interface Place {
  address: string;
  box: string;
}

interface Availability {
  from: string;
  to: string;
}

interface SearchCriteria {
  place?: string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

type ListingEither = Either.Either<ListedActiveListings, UnknownError>;

const toUtcDate = (day: string): Date => new Date(`${day}T00:00:00.000Z`);

export const numberedAddresses = (from: number, to: number): string[] => {
  const addresses: string[] = [];
  for (let number = from; number <= to; number += 1)
    addresses.push(`${number} rue d'Essai, 06000 Nice`);
  return addresses;
};

export const createListActiveListingsSUT = () => {
  const listingRepository = new InMemoryListingRepository();
  const listActiveListings = new ListActiveListings(listingRepository);

  const context = { listingRepository, listActiveListings };

  const push = (
    place: Place,
    status: ListingStatus,
    availability?: Availability,
  ) => {
    const builder = new ListingBuilder()
      .withOwnerId('account-marc')
      .withAddress(place.address)
      .withBox(place.box)
      .withStatus(status);
    if (availability)
      builder.withAvailability({
        from: toUtcDate(availability.from),
        to: toUtcDate(availability.to),
      });
    context.listingRepository.listingList.push(builder.build());
  };

  return {
    context,

    givenActiveListing(place: Place, availability?: Availability) {
      push(place, ListingStatus.ACTIVE, availability);
    },

    givenUnpublishedListing(place: Place) {
      push(place, ListingStatus.UNPUBLISHED);
    },

    givenActiveListingsNumbered(count: number) {
      numberedAddresses(1, count).forEach((address, index) => {
        push({ address, box: String(index + 1) }, ListingStatus.ACTIVE);
      });
    },

    givenListingRepositoryFailsToRead() {
      context.listingRepository.findAllActive = () => {
        throw new Error('listings repository is unreachable');
      };
    },

    async whenListing(criteria: SearchCriteria = {}): Promise<ListingEither> {
      return context.listActiveListings.execute({
        place: criteria.place,
        from:
          criteria.from === undefined ? undefined : toUtcDate(criteria.from),
        to: criteria.to === undefined ? undefined : toUtcDate(criteria.to),
        page: criteria.page,
        size: criteria.size,
      });
    },

    thenListingsAre(result: ListingEither, expected: Place[]) {
      expect(Either.isRight(result)).toEqual(true);
      if (!Either.isRight(result)) return;
      expect(
        result.right.listings.map((listing) => ({
          address: listing.toState().address,
          box: listing.toState().box,
        })),
      ).toEqual(expected);
    },

    thenListedAddressesAre(result: ListingEither, expected: string[]) {
      expect(Either.isRight(result)).toEqual(true);
      if (!Either.isRight(result)) return;
      expect(
        result.right.listings.map((listing) => listing.toState().address),
      ).toEqual(expected);
    },

    thenTotalIs(result: ListingEither, total: number) {
      expect(Either.isRight(result)).toEqual(true);
      if (!Either.isRight(result)) return;
      expect(result.right.total).toEqual(total);
    },

    thenPageSizeIs(result: ListingEither, size: number) {
      expect(Either.isRight(result)).toEqual(true);
      if (!Either.isRight(result)) return;
      expect(result.right.size).toEqual(size);
    },

    thenResultIsAnUnknownError(result: Either.Either<unknown, unknown>) {
      expect(Either.isLeft(result)).toEqual(true);
      if (Either.isLeft(result))
        expect(result.left).toBeInstanceOf(UnknownError);
    },
  };
};
