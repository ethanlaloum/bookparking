import { Either } from 'effect/index';

import { InMemoryListingRepository } from '../../../adapters/repositories/listing/InMemoryListingRepository';
import { InMemoryPhotoStorage } from '../../../adapters/repositories/listing-photo/InMemoryPhotoStorage';
import { ListingBuilder } from '../../builders/ListingBuilder';
import { ListingPhotoBuilder } from '../../builders/ListingPhotoBuilder';
import { Listing, ListingStatus, VehicleType } from '../../entities/Listing';
import { EditListing } from './EditListing';

interface PricingForTest {
  day: number | null;
  week: number | null;
  month: number | null;
}

interface EditionForTest {
  accessDescription: string;
  photos: string[];
  acceptedVehicles: string[];
  pricing: PricingForTest;
  availability: { from: string; to: string };
}

interface EditingInput extends EditionForTest {
  owner: string;
  listingId: string;
  editedAt: string;
}

const toUtcDate = (day: string): Date => new Date(`${day}T00:00:00.000Z`);

const toListingPricing = (pricing: PricingForTest) => ({
  dayInCents: pricing.day,
  weekInCents: pricing.week,
  monthInCents: pricing.month,
});

export const createEditListingSUT = () => {
  const listingRepository = new InMemoryListingRepository();
  const photoStorage = new InMemoryPhotoStorage();

  const testConstants = {
    ownerNameForTest: 'Marc D.',
    ownerIdForTest: 'account-marc',
    listingIdForTest: '8f1d3b3e-9f1a-4a0e-8f1a-2b7c5d9e0a11',
    addressForTest: '12 rue Barla, 06300 Nice',
    boxForTest: '12',
    publishedAtForTest: '2026-09-10',
  };

  const editListing = new EditListing(listingRepository, photoStorage);

  const accountIdsByOwnerName: Record<string, string> = {
    [testConstants.ownerNameForTest]: testConstants.ownerIdForTest,
  };

  const toAccountId = (ownerName: string): string =>
    accountIdsByOwnerName[ownerName] ?? `account-${ownerName}`;

  const context = {
    listingRepository,
    photoStorage,
    editListing,
    testConstants,
  };

  const storedListing = (): Listing => {
    const found = context.listingRepository.listingList.find(
      (listing) => listing.id === context.testConstants.listingIdForTest,
    );
    if (!found) throw new Error('No listing was given to this test');
    return found;
  };

  return {
    context,

    givenListing(
      params: EditionForTest & { owner: string; status?: ListingStatus },
    ) {
      const listing = new ListingBuilder()
        .withId(context.testConstants.listingIdForTest)
        .withOwnerId(toAccountId(params.owner))
        .withAddress(context.testConstants.addressForTest)
        .withBox(context.testConstants.boxForTest)
        .withAccessDescription(params.accessDescription)
        .withPhotos(params.photos)
        .withAcceptedVehicles(params.acceptedVehicles as VehicleType[])
        .withPricing(toListingPricing(params.pricing))
        .withAvailability({
          from: toUtcDate(params.availability.from),
          to: toUtcDate(params.availability.to),
        })
        .withStatus(params.status ?? ListingStatus.ACTIVE)
        .withPublishedAt(toUtcDate(context.testConstants.publishedAtForTest))
        .build();
      context.listingRepository.listingList.push(listing);
      return { listing };
    },

    givenPhotoUploadedBy(ownerName: string, photoId: string) {
      context.photoStorage.photoList.push(
        new ListingPhotoBuilder()
          .withId(photoId)
          .withOwnerId(toAccountId(ownerName))
          .build(),
      );
    },

    async whenEditing(input: EditingInput) {
      return context.editListing.execute({
        ownerId: toAccountId(input.owner),
        listingId: input.listingId,
        accessDescription: input.accessDescription,
        photos: input.photos,
        acceptedVehicles: input.acceptedVehicles as VehicleType[],
        pricing: toListingPricing(input.pricing),
        availability: {
          from: toUtcDate(input.availability.from),
          to: toUtcDate(input.availability.to),
        },
        editedAt: toUtcDate(input.editedAt),
      });
    },

    thenEditedListingIs(
      result: Either.Either<Listing, unknown>,
      expected: EditionForTest & { owner: string },
    ) {
      const expectedState = {
        id: context.testConstants.listingIdForTest,
        ownerId: toAccountId(expected.owner),
        address: context.testConstants.addressForTest,
        box: context.testConstants.boxForTest,
        accessDescription: expected.accessDescription,
        photos: expected.photos,
        acceptedVehicles: expected.acceptedVehicles,
        pricing: toListingPricing(expected.pricing),
        availability: {
          from: toUtcDate(expected.availability.from),
          to: toUtcDate(expected.availability.to),
        },
        status: ListingStatus.ACTIVE,
        publishedAt: toUtcDate(context.testConstants.publishedAtForTest),
      };
      expect(Either.isRight(result)).toEqual(true);
      if (Either.isRight(result))
        expect(result.right.toState()).toEqual(expectedState);
      expect(storedListing().toState()).toEqual(expectedState);
    },

    thenEditIsRefusedWith(
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

    thenListingIsUnchanged(original: Listing) {
      expect(storedListing().toState()).toEqual(original.toState());
    },
  };
};
