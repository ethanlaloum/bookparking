import { Either } from 'effect/index';

import { InMemoryListingRepository } from '../../../adapters/repositories/listing/InMemoryListingRepository';
import { InMemoryPlaceOccupancy } from '../../../adapters/repositories/place-occupancy/InMemoryPlaceOccupancy';
import { ListingBuilder } from '../../builders/ListingBuilder';
import { Listing, ListingStatus } from '../../entities/Listing';
import { StayDays } from '../../entities/StayDays';
import { ListFreeListings } from './ListFreeListings';

interface PlaceForTest {
  box: string;
  open: { from: string; to: string };
  status?: ListingStatus;
}

const toUtcDate = (day: string): Date => new Date(`${day}T00:00:00.000Z`);

export const createListFreeListingsSUT = () => {
  const listingRepository = new InMemoryListingRepository();
  const placeOccupancy = new InMemoryPlaceOccupancy();
  const listFreeListings = new ListFreeListings(
    listingRepository,
    placeOccupancy,
  );

  const testConstants = { addressForTest: '12 rue Barla, 06300 Nice' };

  const context = {
    listingRepository,
    placeOccupancy,
    listFreeListings,
    testConstants,
  };

  return {
    context,

    givenPlace(place: PlaceForTest): Listing {
      const listing = new ListingBuilder()
        .withAddress(context.testConstants.addressForTest)
        .withBox(place.box)
        .withAvailability({
          from: toUtcDate(place.open.from),
          to: toUtcDate(place.open.to),
        })
        .withStatus(place.status ?? ListingStatus.ACTIVE)
        .build();
      context.listingRepository.listingList.push(listing);
      return listing;
    },

    givenPlaceTaken(listing: Listing) {
      context.placeOccupancy.takenPlaceKeys.push(listing.placeKey());
    },

    async whenSearching(stay: StayDays, viewerId: string | null = null) {
      return context.listFreeListings.execute({ stay, viewerId });
    },

    thenFreeListingsAre(
      result: Either.Either<Listing[], unknown>,
      expected: Listing[],
    ) {
      expect(Either.isRight(result)).toEqual(true);
      if (Either.isRight(result))
        expect(result.right.map((listing) => listing.toState())).toEqual(
          expected.map((listing) => listing.toState()),
        );
    },

    thenOccupancyWasAskedFor(
      expected: { stay: StayDays; viewerId: string | null }[],
    ) {
      expect(context.placeOccupancy.asked).toEqual(expected);
    },

    thenSearchIsRefusedWith(
      result: Either.Either<unknown, unknown>,
      ErrorClass: new (...args: never[]) => Error,
      message: string,
    ) {
      expect(Either.isLeft(result)).toEqual(true);
      if (Either.isLeft(result)) {
        expect(result.left).toBeInstanceOf(ErrorClass);
        expect((result.left as Error).message).toEqual(message);
      }
    },
  };
};
