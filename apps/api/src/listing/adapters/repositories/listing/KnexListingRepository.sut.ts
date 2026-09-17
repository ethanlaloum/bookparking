import { getTestDbConnection } from '../../../../infra/testcontainers-setup';
import { ListingBuilder } from '../../../domain/builders/ListingBuilder';
import { ListingStatus } from '../../../domain/entities/Listing';
import { PublishListing } from '../../../domain/usecases/publish-listing/PublishListing';
import { InMemoryPhotoStorage } from '../../services/photo-storage/InMemoryPhotoStorage';
import { KnexListingRepository } from './KnexListingRepository';
import { SchemaListingRepository } from './SchemaListingRepository';

interface Place {
  address: string;
  box: string;
}

interface PublishingInput {
  owner: string;
  address: string;
  box: string;
  accessDescription: string;
  photos: string[];
  pricing: { day: number; week: number; month: number };
  availability: { from: string; to: string };
  publishedAt: string;
}

const toUtcDate = (day: string): Date => new Date(`${day}T00:00:00.000Z`);

export const createKnexListingRepositorySUT = () => {
  const testDbConnection = getTestDbConnection();
  const listingRepository = new KnexListingRepository(testDbConnection);
  const photoStorage = new InMemoryPhotoStorage();
  const publishListing = new PublishListing(listingRepository, photoStorage);

  const testConstants = {
    ownerNameForTest: 'Marc D.',
    ownerIdForTest: 'account-marc',
  };

  const accountIdsByOwnerName: Record<string, string> = {
    [testConstants.ownerNameForTest]: testConstants.ownerIdForTest,
  };

  const toAccountId = (ownerName: string): string =>
    accountIdsByOwnerName[ownerName] ?? `account-${ownerName}`;

  const context = {
    testDbConnection,
    listingRepository,
    photoStorage,
    publishListing,
    testConstants,
  };

  return {
    context,

    givenPhotoStorageFailingOnEveryUpload() {
      context.photoStorage.enableFailureOnEveryUpload();
    },

    async whenPublishing(input: PublishingInput) {
      return context.publishListing.execute({
        ownerId: toAccountId(input.owner),
        address: input.address,
        box: input.box,
        accessDescription: input.accessDescription,
        photos: input.photos,
        pricing: {
          dayInCents: input.pricing.day,
          weekInCents: input.pricing.week,
          monthInCents: input.pricing.month,
        },
        availability: {
          from: toUtcDate(input.availability.from),
          to: toUtcDate(input.availability.to),
        },
        publishedAt: toUtcDate(input.publishedAt),
      });
    },

    async whenCreatingActiveListing(input: {
      owner: string;
      address: string;
      box: string;
    }): Promise<unknown> {
      const listing = new ListingBuilder()
        .withOwnerId(toAccountId(input.owner))
        .withAddress(input.address)
        .withBox(input.box)
        .build();
      try {
        await context.listingRepository.create(listing);
        return null;
      } catch (error: unknown) {
        return error;
      }
    },

    thenCreationSucceeded(outcome: unknown) {
      expect(outcome).toEqual(null);
    },

    thenCreationIsRefusedWith(
      outcome: unknown,
      ErrorClass: new (...args: never[]) => Error,
      message: string,
    ) {
      expect(outcome).toBeInstanceOf(ErrorClass);
      expect((outcome as Error).message).toEqual(message);
    },

    async thenActiveRowCountIs(count: number) {
      const rows = await context
        .testDbConnection<SchemaListingRepository>('listings')
        .where({ status: ListingStatus.ACTIVE });
      expect(rows).toHaveLength(count);
    },

    async thenNoListingRow(place: Place) {
      const rows = await context
        .testDbConnection<SchemaListingRepository>('listings')
        .where({ address: place.address, box: place.box });
      expect(rows).toEqual([]);
    },
  };
};
