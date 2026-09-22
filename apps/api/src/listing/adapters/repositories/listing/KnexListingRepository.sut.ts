import { getTestDbConnection } from '../../../../infra/testcontainers-setup';
import { ListingBuilder } from '../../../domain/builders/ListingBuilder';
import { Listing, ListingStatus } from '../../../domain/entities/Listing';
import { PublishListing } from '../../../domain/usecases/publish-listing/PublishListing';
import { UnpublishListing } from '../../../domain/usecases/unpublish-listing/UnpublishListing';
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
  const unpublishListing = new UnpublishListing(listingRepository);

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
    unpublishListing,
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

    async givenActiveListingRow(input: {
      address: string;
      box: string;
      publishedAt: string;
    }): Promise<void> {
      await context.listingRepository.create(
        new ListingBuilder()
          .withOwnerId(toAccountId('Marc D.'))
          .withAddress(input.address)
          .withBox(input.box)
          .withStatus(ListingStatus.ACTIVE)
          .withPublishedAt(new Date(`${input.publishedAt}T00:00:00.000Z`))
          .build(),
      );
    },

    async givenUnpublishedListingRow(input: {
      address: string;
      box: string;
      publishedAt: string;
    }): Promise<void> {
      await context.listingRepository.create(
        new ListingBuilder()
          .withOwnerId(toAccountId('Marc D.'))
          .withAddress(input.address)
          .withBox(input.box)
          .withStatus(ListingStatus.UNPUBLISHED)
          .withPublishedAt(new Date(`${input.publishedAt}T00:00:00.000Z`))
          .build(),
      );
    },

    async whenListingAllActive() {
      return context.listingRepository.findAllActive();
    },

    thenListedPlacesAre(
      listed: { toState(): { address: string; box: string } }[],
      expected: { address: string; box: string }[],
    ) {
      expect(
        listed.map((listing) => ({
          address: listing.toState().address,
          box: listing.toState().box,
        })),
      ).toEqual(expected);
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

    async whenUnpublishing(input: { owner: string } & Place) {
      return context.unpublishListing.execute({
        ownerId: toAccountId(input.owner),
        address: input.address,
        box: input.box,
      });
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

    async thenStoredListingIsUnpublished(place: Place) {
      const rows = await context
        .testDbConnection<SchemaListingRepository>('listings')
        .where({ place_key: Listing.placeKeyOf(place) });
      expect(rows).toHaveLength(1);
      expect(rows[0].status).toEqual(ListingStatus.UNPUBLISHED);
    },

    async thenNoActiveListingIsFoundFor(place: Place) {
      const found = await context.listingRepository.findActiveByPlaceKey(
        Listing.placeKeyOf(place),
      );
      expect(found).toEqual(null);
    },

    async thenNoListingRow(place: Place) {
      const rows = await context
        .testDbConnection<SchemaListingRepository>('listings')
        .where({ address: place.address, box: place.box });
      expect(rows).toEqual([]);
    },
  };
};
