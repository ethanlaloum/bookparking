import { ModuleMetadata } from '@nestjs/common';
import { Either } from 'effect/index';

import { TestAuthState } from '../../../../../shared/test/http/TestAuthGuard';
import { UseCaseDouble } from '../../../../../shared/test/http/UseCaseDouble';
import { ListingBuilder } from '../../../../domain/builders/ListingBuilder';
import {
  Listing,
  ListingEdition,
  ListingStatus,
} from '../../../../domain/entities/Listing';
import { ListActiveListings } from '../../../../domain/usecases/list-active-listings/ListActiveListings';
import { ListOwnerListings } from '../../../../domain/usecases/list-owner-listings/ListOwnerListings';
import { ListFreeListings } from '../../../../domain/usecases/list-free-listings/ListFreeListings';
import { InvalidStayError } from '../../../../domain/usecases/list-free-listings/errors/InvalidStayError';
import { StayDays } from '../../../../domain/entities/StayDays';
import { GetListing } from '../../../../domain/usecases/get-listing/GetListing';
import { ListingNotFoundError } from '../../../../domain/usecases/get-listing/errors/ListingNotFoundError';
import { PublishListing } from '../../../../domain/usecases/publish-listing/PublishListing';
import { AvailabilityPeriodExpiredError } from '../../../../domain/errors/AvailabilityPeriodExpiredError';
import { ActiveListingNotFoundError } from '../../../../domain/errors/ActiveListingNotFoundError';
import { IncompletePricingError } from '../../../../domain/errors/IncompletePricingError';
import { ListingNotOwnedError } from '../../../../domain/errors/ListingNotOwnedError';
import { UnknownPhotoError } from '../../../../domain/errors/UnknownPhotoError';
import { UnpublishListing } from '../../../../domain/usecases/unpublish-listing/UnpublishListing';
import { EditListing } from '../../../../domain/usecases/edit-listing/EditListing';
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
  const editListing = new UseCaseDouble<
    ListingEdition & { ownerId: string; listingId: string; editedAt: Date },
    Either.Either<
      Listing,
      | ActiveListingNotFoundError
      | ListingNotOwnedError
      | AvailabilityPeriodExpiredError
      | IncompletePricingError
      | UnknownPhotoError
    >
  >();
  const listOwnerListings = new UseCaseDouble<
    { ownerId: string },
    Either.Either<Listing[], never>
  >();
  const listFreeListings = new UseCaseDouble<
    { stay: StayDays; viewerId: string | null },
    Either.Either<Listing[], InvalidStayError>
  >();
  const authState: TestAuthState = { user: { id: MARC_ACCOUNT_ID } };

  const metadata: ModuleMetadata = {
    controllers: [ListingController],
    providers: [
      { provide: PublishListing, useValue: publishListing },
      { provide: GetListing, useValue: getListing },
      { provide: ListActiveListings, useValue: listActiveListings },
      { provide: ListOwnerListings, useValue: listOwnerListings },
      { provide: UnpublishListing, useValue: unpublishListing },
      { provide: EditListing, useValue: editListing },
      { provide: ListFreeListings, useValue: listFreeListings },
    ],
  };

  return {
    metadata,
    publishListing,
    getListing,
    unpublishListing,
    editListing,
    listOwnerListings,
    listFreeListings,
    listActiveListings,
    authState,

    givenFreeListings(fixtures: ListingFixture[]) {
      const listings = fixtures.map((fixture) =>
        new ListingBuilder()
          .withId(fixture.id)
          .withOwnerId(MARC_ACCOUNT_ID)
          .withAddress(fixture.address)
          .withBox(fixture.box)
          .build(),
      );
      listFreeListings.willResolve(Either.right(listings));
      return { listings };
    },

    givenStayIsRefused() {
      listFreeListings.willResolve(Either.left(new InvalidStayError()));
    },

    givenUnpublicationSucceeds() {
      unpublishListing.willResolve(Either.right(undefined));
    },

    givenListingBelongsToSomeoneElse() {
      unpublishListing.willResolve(Either.left(new ListingNotOwnedError()));
      editListing.willResolve(Either.left(new ListingNotOwnedError()));
    },

    givenEditSucceeds(listing: Listing) {
      editListing.willResolve(Either.right(listing));
    },

    givenEditIsRefusedWith(
      error:
        | ActiveListingNotFoundError
        | AvailabilityPeriodExpiredError
        | IncompletePricingError
        | UnknownPhotoError,
    ) {
      editListing.willResolve(Either.left(error));
    },

    givenOwnerListings(listings: Listing[]) {
      listOwnerListings.willResolve(Either.right(listings));
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

    thenEditWasRequestedWith(
      edition: ListingEdition & { ownerId: string; listingId: string },
    ) {
      expect(editListing.calls).toHaveLength(1);
      const [call] = editListing.calls;
      const { editedAt, ...requested } = call;
      expect(requested).toEqual(edition);
      expect(editedAt).toBeInstanceOf(Date);
    },

    thenNothingWasEdited() {
      expect(editListing.calls).toHaveLength(0);
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
