import { Either } from 'effect/index';

import { ListingBuilder } from '../../builders/ListingBuilder';
import { ListingStatus } from '../../entities/Listing';
import { InMemoryListingRepository } from '../../../adapters/repositories/listing/InMemoryListingRepository';
import { UpdateListingPricing } from './UpdateListingPricing';

interface Place {
  address: string;
  box: string;
}

interface PricingForTest {
  day: number | null;
  week: number | null;
  month: number | null;
}

interface PricingUpdateInput {
  owner: string;
  address: string;
  box: string;
  pricing: PricingForTest;
  updatedAt: string;
}

const toUtcDate = (day: string): Date => new Date(`${day}T00:00:00.000Z`);

const toListingPricing = (pricing: PricingForTest) => ({
  dayInCents: pricing.day,
  weekInCents: pricing.week,
  monthInCents: pricing.month,
});

export const createUpdateListingPricingSUT = () => {
  const listingRepository = new InMemoryListingRepository();

  const testConstants = {
    ownerNameForTest: 'Marc D.',
    ownerIdForTest: 'account-marc',
    addressForTest: '12 rue Barla, 06300 Nice',
    boxForTest: '12',
  };

  const updateListingPricing = new UpdateListingPricing(listingRepository);

  const accountIdsByOwnerName: Record<string, string> = {
    [testConstants.ownerNameForTest]: testConstants.ownerIdForTest,
  };

  const toAccountId = (ownerName: string): string =>
    accountIdsByOwnerName[ownerName] ?? `account-${ownerName}`;

  const context = {
    listingRepository,
    updateListingPricing,
    testConstants,
  };

  return {
    context,

    givenActiveListing(
      params: { owner: string; pricing: PricingForTest } & Place,
    ) {
      const listing = new ListingBuilder()
        .withOwnerId(toAccountId(params.owner))
        .withAddress(params.address)
        .withBox(params.box)
        .withPricing(toListingPricing(params.pricing))
        .withStatus(ListingStatus.ACTIVE)
        .build();
      context.listingRepository.listingList.push(listing);
      return { listing };
    },

    async whenUpdatingPricing(overrides?: Partial<PricingUpdateInput>) {
      const defaults: PricingUpdateInput = {
        owner: context.testConstants.ownerNameForTest,
        address: context.testConstants.addressForTest,
        box: context.testConstants.boxForTest,
        pricing: { day: 1200, week: 6000, month: 18000 },
        updatedAt: '2026-09-12',
      };
      const input = { ...defaults, ...overrides };

      return context.updateListingPricing.execute({
        ownerId: toAccountId(input.owner),
        address: input.address,
        box: input.box,
        pricing: toListingPricing(input.pricing),
        updatedAt: toUtcDate(input.updatedAt),
      });
    },

    thenUpdateIsRefusedWith(
      result: Either.Either<unknown, unknown>,
      ErrorClass: new (...args: never[]) => Error,
    ) {
      expect(Either.isLeft(result)).toEqual(true);
      if (Either.isLeft(result)) {
        expect(result.left).toBeInstanceOf(ErrorClass);
      }
    },

    thenRefusalMessageIs(
      result: Either.Either<unknown, unknown>,
      message: string,
    ) {
      expect(Either.isLeft(result)).toEqual(true);
      if (Either.isLeft(result)) {
        expect((result.left as Error).message).toEqual(message);
      }
    },

    thenActiveListingPricingIs(place: Place, pricing: PricingForTest) {
      const activeListings = context.listingRepository.listingList.filter(
        (listing) => listing.isActiveFor(place),
      );
      expect(activeListings).toHaveLength(1);
      expect(activeListings[0].toState().pricing).toEqual(
        toListingPricing(pricing),
      );
    },
  };
};
