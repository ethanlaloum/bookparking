import { ModuleMetadata } from '@nestjs/common';
import { Either } from 'effect/index';

import { TestAuthState } from '../../../../../shared/test/http/TestAuthGuard';
import { UseCaseDouble } from '../../../../../shared/test/http/UseCaseDouble';
import { ListingBuilder } from '../../../../domain/builders/ListingBuilder';
import { ListingStatus } from '../../../../domain/entities/Listing';
import { ListActiveListings } from '../../../../domain/usecases/list-active-listings/ListActiveListings';
import { GetListing } from '../../../../domain/usecases/get-listing/GetListing';
import { ListingNotFoundError } from '../../../../domain/usecases/get-listing/errors/ListingNotFoundError';
import { PublishListing } from '../../../../domain/usecases/publish-listing/PublishListing';
import { IncompletePricingError } from '../../../../domain/errors/IncompletePricingError';
import { ListingNotOwnedError } from '../../../../domain/errors/ListingNotOwnedError';
import { UnpublishListing } from '../../../../domain/usecases/unpublish-listing/UnpublishListing';
import { UpdateListingPricing } from '../../../../domain/usecases/update-listing-pricing/UpdateListingPricing';
import { ListingController } from './listing.controller';

export const MARC_ACCOUNT_ID = 'account-marc';

interface ListingFixture {
  id: string;
  address: string;
  box: string;
  accessDescription?: string;
}

export const createListingControllerSUT = () => {
  const publishListing = new UseCaseDouble();
  const getListing = new UseCaseDouble();
  const listActiveListings = new UseCaseDouble();
  const unpublishListing = new UseCaseDouble<
    { ownerId: string; address: string; box: string },
    Either.Either<undefined, ListingNotOwnedError>
  >();
  const updateListingPricing = new UseCaseDouble<
    {
      ownerId: string;
      address: string;
      box: string;
      pricing: {
        dayInCents: number | null;
        weekInCents: number | null;
        monthInCents: number | null;
      };
    },
    Either.Either<unknown, IncompletePricingError | ListingNotOwnedError>
  >();
  const authState: TestAuthState = { user: { id: MARC_ACCOUNT_ID } };

  const metadata: ModuleMetadata = {
    controllers: [ListingController],
    providers: [
      { provide: PublishListing, useValue: publishListing },
      { provide: GetListing, useValue: getListing },
      { provide: ListActiveListings, useValue: listActiveListings },
      { provide: UnpublishListing, useValue: unpublishListing },
      { provide: UpdateListingPricing, useValue: updateListingPricing },
    ],
  };

  return {
    metadata,
    publishListing,
    getListing,
    unpublishListing,
    updateListingPricing,
    authState,

    givenUnpublicationSucceeds() {
      unpublishListing.willResolve(Either.right(undefined));
    },

    givenListingBelongsToSomeoneElse() {
      unpublishListing.willResolve(Either.left(new ListingNotOwnedError()));
      updateListingPricing.willResolve(Either.left(new ListingNotOwnedError()));
    },

    givenPricingUpdateSucceeds(listing: unknown) {
      updateListingPricing.willResolve(Either.right(listing));
    },

    givenPricingIsIncomplete() {
      updateListingPricing.willResolve(
        Either.left(new IncompletePricingError()),
      );
    },

    thenListingWasUnpublishedFor(place: { address: string; box: string }) {
      expect(unpublishListing.calls).toHaveLength(1);
      expect(unpublishListing.lastCall?.ownerId).toEqual(MARC_ACCOUNT_ID);
      expect(unpublishListing.lastCall?.address).toEqual(place.address);
      expect(unpublishListing.lastCall?.box).toEqual(place.box);
    },

    thenNothingWasUnpublished() {
      expect(unpublishListing.calls).toHaveLength(0);
    },

    thenPricingWasUpdatedTo(pricing: {
      dayInCents: number | null;
      weekInCents: number | null;
      monthInCents: number | null;
    }) {
      expect(updateListingPricing.calls).toHaveLength(1);
      expect(updateListingPricing.lastCall?.pricing).toEqual(pricing);
    },

    thenNoPricingWasUpdated() {
      expect(updateListingPricing.calls).toHaveLength(0);
    },

    givenActiveListing(fixture: ListingFixture) {
      const builder = new ListingBuilder()
        .withId(fixture.id)
        .withOwnerId(MARC_ACCOUNT_ID)
        .withAddress(fixture.address)
        .withBox(fixture.box)
        .withStatus(ListingStatus.ACTIVE);

      const listing = (
        fixture.accessDescription
          ? builder.withAccessDescription(fixture.accessDescription)
          : builder
      ).build();

      getListing.willResolve(Either.right(listing));
      return { listing };
    },

    givenActiveListings(fixtures: ListingFixture[]) {
      const listings = fixtures.map((fixture) => {
        const builder = new ListingBuilder()
          .withId(fixture.id)
          .withOwnerId(MARC_ACCOUNT_ID)
          .withAddress(fixture.address)
          .withBox(fixture.box)
          .withStatus(ListingStatus.ACTIVE);
        return (
          fixture.accessDescription
            ? builder.withAccessDescription(fixture.accessDescription)
            : builder
        ).build();
      });
      listActiveListings.willResolve(Either.right(listings));
      return { listings };
    },

    givenNoListing() {
      getListing.willResolve(Either.left(new ListingNotFoundError()));
    },

    givenUnpublishedListing(fixture: ListingFixture) {
      const listing = new ListingBuilder()
        .withId(fixture.id)
        .withOwnerId(MARC_ACCOUNT_ID)
        .withAddress(fixture.address)
        .withBox(fixture.box)
        .withStatus(ListingStatus.UNPUBLISHED)
        .build();

      getListing.willResolve(Either.left(new ListingNotFoundError()));
      return { listing };
    },
  };
};
