import { getTestDbConnection } from '../../../../infra/testcontainers-setup';
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

  const context = {
    testDbConnection,
    listingRepository,
    photoStorage,
    publishListing,
  };

  return {
    context,

    givenPhotoStorageFailingOnEveryUpload() {
      context.photoStorage.enableFailureOnEveryUpload();
    },

    async whenPublishing(input: PublishingInput) {
      return context.publishListing.execute({
        ownerName: input.owner,
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

    async thenNoListingRow(place: Place) {
      const rows = await context
        .testDbConnection<SchemaListingRepository>('listings')
        .where({ address: place.address, box: place.box });
      expect(rows).toEqual([]);
    },
  };
};
