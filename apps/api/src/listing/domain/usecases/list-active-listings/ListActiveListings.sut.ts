import { Either } from 'effect/index';

import { UnknownError } from '../../../../shared/error/errors/UnknownError';
import { InMemoryListingRepository } from '../../../adapters/repositories/listing/InMemoryListingRepository';
import { ListingBuilder } from '../../builders/ListingBuilder';
import { Listing, ListingStatus } from '../../entities/Listing';
import { ListActiveListings } from './ListActiveListings';

interface Place {
  address: string;
  box: string;
}

export const createListActiveListingsSUT = () => {
  const listingRepository = new InMemoryListingRepository();
  const listActiveListings = new ListActiveListings(listingRepository);

  const context = { listingRepository, listActiveListings };

  const push = (place: Place, status: ListingStatus) => {
    context.listingRepository.listingList.push(
      new ListingBuilder()
        .withOwnerId('account-marc')
        .withAddress(place.address)
        .withBox(place.box)
        .withStatus(status)
        .build(),
    );
  };

  return {
    context,

    givenActiveListing(place: Place) {
      push(place, ListingStatus.ACTIVE);
    },

    givenUnpublishedListing(place: Place) {
      push(place, ListingStatus.UNPUBLISHED);
    },

    givenListingRepositoryFailsToRead() {
      context.listingRepository.findAllActive = () => {
        throw new Error('listings repository is unreachable');
      };
    },

    async whenListing() {
      return context.listActiveListings.execute();
    },

    thenListingsAre(
      result: Either.Either<Listing[], unknown>,
      expected: Place[],
    ) {
      expect(Either.isRight(result)).toEqual(true);
      if (!Either.isRight(result)) return;
      expect(
        result.right.map((listing) => ({
          address: listing.toState().address,
          box: listing.toState().box,
        })),
      ).toEqual(expected);
    },

    thenResultIsAnUnknownError(result: Either.Either<unknown, unknown>) {
      expect(Either.isLeft(result)).toEqual(true);
      if (Either.isLeft(result))
        expect(result.left).toBeInstanceOf(UnknownError);
    },
  };
};
