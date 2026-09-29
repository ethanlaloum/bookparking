import { Either } from 'effect/index';

import { UnknownError } from '../../../../shared/error/errors/UnknownError';
import { InMemoryListingRepository } from '../../../adapters/repositories/listing/InMemoryListingRepository';
import { ListingBuilder } from '../../builders/ListingBuilder';
import { Listing, ListingStatus } from '../../entities/Listing';
import { ListOwnerListings } from './ListOwnerListings';

interface Place {
  address: string;
  box: string;
}

export const createListOwnerListingsSUT = () => {
  const listingRepository = new InMemoryListingRepository();
  const listOwnerListings = new ListOwnerListings(listingRepository);

  const context = { listingRepository, listOwnerListings };

  const push = (ownerId: string, place: Place, status: ListingStatus) => {
    context.listingRepository.listingList.push(
      new ListingBuilder()
        .withOwnerId(ownerId)
        .withAddress(place.address)
        .withBox(place.box)
        .withStatus(status)
        .build(),
    );
  };

  return {
    context,

    givenActiveListingOwnedBy(ownerId: string, place: Place) {
      push(ownerId, place, ListingStatus.ACTIVE);
    },

    givenUnpublishedListingOwnedBy(ownerId: string, place: Place) {
      push(ownerId, place, ListingStatus.UNPUBLISHED);
    },

    givenListingRepositoryFailsToRead() {
      context.listingRepository.findAllByOwner = () => {
        throw new Error('listings repository is unreachable');
      };
    },

    async whenListingFor(ownerId: string) {
      return context.listOwnerListings.execute({ ownerId });
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
