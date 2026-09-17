import { Either } from 'effect/index';

import { ListingBuilder } from '../../builders/ListingBuilder';
import { Listing, ListingStatus } from '../../entities/Listing';
import { InMemoryListingRepository } from '../../../adapters/repositories/listing/InMemoryListingRepository';
import { InMemoryPhotoStorage } from '../../../adapters/services/photo-storage/InMemoryPhotoStorage';
import { PublishListing } from './PublishListing';

interface Place {
  address: string;
  box: string;
}

interface OwnerForTest {
  name: string;
  createdAt?: string;
  identityDocument?: string | null;
  iban?: string | null;
  identityVerificationStartedAt?: string;
  identityVerificationCompleted?: boolean;
}

interface PublishingInput {
  owner: string;
  address: string;
  box: string;
  accessDescription: string;
  photos: string[];
  pricing: { day: number | null; week: number | null; month: number | null };
  availability: { from: string; to: string };
  publishedAt: string;
}

const toUtcDate = (day: string): Date => new Date(`${day}T00:00:00.000Z`);

const toUtcDay = (date: Date): string => date.toISOString().slice(0, 10);

const toDisplayedListing = (listing: Listing) => {
  const state = listing.toState();
  return {
    address: state.address,
    box: state.box,
    accessDescription: state.accessDescription,
    photos: state.photos,
    pricing: {
      day: state.pricing.dayInCents,
      week: state.pricing.weekInCents,
      month: state.pricing.monthInCents,
    },
    availability: {
      from: toUtcDay(state.availability.from),
      to: toUtcDay(state.availability.to),
    },
  };
};

export const createPublishListingSUT = () => {
  const listingRepository = new InMemoryListingRepository();
  const photoStorage = new InMemoryPhotoStorage();

  const testConstants = {
    ownerNameForTest: 'Marc D.',
    ownerIdForTest: 'account-marc',
    addressForTest: '12 rue Barla, 06300 Nice',
    boxForTest: '12',
    otherOwnerNameForTest: 'Pierre L.',
    otherOwnerIdForTest: 'account-pierre',
  };

  const publishListing = new PublishListing(listingRepository, photoStorage);

  const accountIdsByOwnerName: Record<string, string> = {
    [testConstants.ownerNameForTest]: testConstants.ownerIdForTest,
    [testConstants.otherOwnerNameForTest]: testConstants.otherOwnerIdForTest,
  };

  const toAccountId = (ownerName: string): string =>
    accountIdsByOwnerName[ownerName] ?? `account-${ownerName}`;

  const context = {
    listingRepository,
    photoStorage,
    publishListing,
    testConstants,
    owner: null as OwnerForTest | null,
  };

  const thenResultIsRight = (result: Either.Either<unknown, unknown>) => {
    expect(Either.isRight(result)).toEqual(true);
  };

  return {
    context,

    givenNoActiveListingFor(place: Place) {
      context.listingRepository.listingList =
        context.listingRepository.listingList.filter(
          (listing) => !listing.isActiveFor(place),
        );
    },

    givenActiveListing(params: { owner: string } & Place) {
      const listing = new ListingBuilder()
        .withOwnerId(toAccountId(params.owner))
        .withAddress(params.address)
        .withBox(params.box)
        .withStatus(ListingStatus.ACTIVE)
        .build();
      context.listingRepository.listingList.push(listing);
      return { listing };
    },

    givenPhotoStorageFailingOnEveryUpload() {
      context.photoStorage.enableFailureOnEveryUpload();
    },

    givenOwner(owner: OwnerForTest) {
      context.owner = owner;
      return { owner };
    },

    async whenPublishing(overrides?: Partial<PublishingInput>) {
      const defaults: PublishingInput = {
        owner: context.testConstants.ownerNameForTest,
        address: context.testConstants.addressForTest,
        box: context.testConstants.boxForTest,
        accessDescription:
          'portail bleu à gauche du 12, le box est au fond du premier sous-sol',
        photos: ['photo-1'],
        pricing: { day: 1200, week: 6000, month: 18000 },
        availability: { from: '2026-10-01', to: '2026-10-31' },
        publishedAt: '2026-09-10',
      };
      const input = { ...defaults, ...overrides };

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

    thenResultIsRight,

    thenListingIsActive(result: Either.Either<Listing, unknown>) {
      thenResultIsRight(result);
      const listings = context.listingRepository.listingList;
      expect(listings).toHaveLength(1);
      expect(listings[0].toState().status).toEqual(ListingStatus.ACTIVE);
      if (Either.isRight(result)) {
        expect(result.right.toState()).toEqual(listings[0].toState());
      }
    },

    thenListingCarries(
      result: Either.Either<Listing, unknown>,
      expected: Partial<ReturnType<typeof toDisplayedListing>>,
    ) {
      thenResultIsRight(result);
      const listings = context.listingRepository.listingList;
      expect(listings).toHaveLength(1);
      const displayed = toDisplayedListing(listings[0]);
      const carried = Object.fromEntries(
        Object.keys(expected).map((key) => [
          key,
          displayed[key as keyof typeof displayed],
        ]),
      );
      expect(carried).toEqual(expected);
    },

    thenPublicationIsRefusedWith(
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

    thenActiveListingOf(ownerName: string, place: Place) {
      const ownerListings = context.listingRepository.listingList.filter(
        (listing) =>
          listing.isActiveFor(place) &&
          listing.toState().ownerId === toAccountId(ownerName),
      );
      expect(ownerListings).toHaveLength(1);
    },

    thenNoListingOf(ownerName: string, place: Place) {
      const ownerListings = context.listingRepository.listingList.filter(
        (listing) =>
          listing.designates(place) &&
          listing.toState().ownerId === toAccountId(ownerName),
      );
      expect(ownerListings).toHaveLength(0);
    },

    thenNoActiveListingFor(place: Place) {
      const activeListings = context.listingRepository.listingList.filter(
        (listing) => listing.isActiveFor(place),
      );
      expect(activeListings).toHaveLength(0);
    },

    thenIsOnlyActiveListingFor(place: Place) {
      const activeListings = context.listingRepository.listingList.filter(
        (listing) => listing.isActiveFor(place),
      );
      expect(activeListings).toHaveLength(1);
    },

    thenNoIdentityDocumentOrIbanWasRequired() {
      expect(context.owner).not.toEqual(null);
      expect(context.owner?.identityDocument ?? null).toEqual(null);
      expect(context.owner?.iban ?? null).toEqual(null);
      const listings = context.listingRepository.listingList;
      expect(listings).toHaveLength(1);
      expect(listings[0].toState().ownerId).toEqual(
        toAccountId(context.owner?.name ?? ''),
      );
      expect(listings[0].toState().status).toEqual(ListingStatus.ACTIVE);
    },
  };
};
