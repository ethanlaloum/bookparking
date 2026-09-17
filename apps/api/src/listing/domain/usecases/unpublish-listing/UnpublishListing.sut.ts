import { Either } from 'effect/index';

import { InMemoryRentalRepository } from '../../../../rental/adapters/repositories/rental/InMemoryRentalRepository';
import { ConfirmedRentalBuilder } from '../../../../rental/domain/builders/ConfirmedRentalBuilder';
import {
  CalendarDay,
  CalendarDayRange,
  dayAfter,
  parisPeriodOfDays,
} from '../../../../rental/domain/entities/CalendarDay';
import { InMemoryListingRepository } from '../../../adapters/repositories/listing/InMemoryListingRepository';
import { ListingBuilder } from '../../builders/ListingBuilder';
import { ListingStatus } from '../../entities/Listing';
import { UnpublishListing } from './UnpublishListing';

interface Place {
  address: string;
  box: string;
}

interface UnpublishingInput {
  owner: string;
  address: string;
  box: string;
  on: string;
}

const toUtcDate = (day: string): Date => new Date(`${day}T00:00:00.000Z`);

const daysOf = (days: CalendarDayRange): CalendarDay[] => {
  const calendarDays: CalendarDay[] = [];
  for (let day = days.from; day <= days.to; day = dayAfter(day))
    calendarDays.push(day);
  return calendarDays;
};

export const createUnpublishListingSUT = () => {
  const listingRepository = new InMemoryListingRepository();
  const rentalRepository = new InMemoryRentalRepository();

  const testConstants = {
    ownerNameForTest: 'Marc D.',
    ownerIdForTest: 'account-marc',
    addressForTest: '12 rue Barla, 06300 Nice',
    boxForTest: '12',
  };

  const unpublishListing = new UnpublishListing(listingRepository);

  const accountIdsByOwnerName: Record<string, string> = {
    [testConstants.ownerNameForTest]: testConstants.ownerIdForTest,
  };

  const toAccountId = (ownerName: string): string =>
    accountIdsByOwnerName[ownerName] ?? `account-${ownerName}`;

  const context = {
    listingRepository,
    rentalRepository,
    unpublishListing,
    testConstants,
  };

  const confirmedRentalsOf = (place: Place) =>
    context.rentalRepository.confirmedRentalList.filter((confirmedRental) =>
      confirmedRental.designates(place),
    );

  return {
    context,

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

    givenUnpublishedListing(
      params: { owner: string; unpublishedOn: string } & Place,
    ) {
      const listing = new ListingBuilder()
        .withOwnerId(toAccountId(params.owner))
        .withAddress(params.address)
        .withBox(params.box)
        .withStatus(ListingStatus.UNPUBLISHED)
        .build();
      context.listingRepository.listingList.push(listing);
      return { listing, unpublishedOn: params.unpublishedOn };
    },

    givenConfirmedRental(params: Place & CalendarDayRange) {
      const confirmedRental = new ConfirmedRentalBuilder()
        .withAddress(params.address)
        .withBox(params.box)
        .withDays({ from: params.from, to: params.to })
        .build();
      context.rentalRepository.confirmedRentalList.push(confirmedRental);
      return { confirmedRental };
    },

    async whenUnpublishing(overrides?: Partial<UnpublishingInput>) {
      const defaults: UnpublishingInput = {
        owner: context.testConstants.ownerNameForTest,
        address: context.testConstants.addressForTest,
        box: context.testConstants.boxForTest,
        on: '2026-10-10',
      };
      const input = { ...defaults, ...overrides };

      return context.unpublishListing.execute({
        ownerId: toAccountId(input.owner),
        address: input.address,
        box: input.box,
        unpublishedAt: toUtcDate(input.on),
      });
    },

    thenResultIsRight(result: Either.Either<unknown, unknown>) {
      expect(Either.isRight(result)).toEqual(true);
    },

    thenListingIsNoLongerPubliclyVisible(place: Place) {
      const publiclyVisibleListings =
        context.listingRepository.listingList.filter((listing) =>
          listing.isActiveFor(place),
        );
      expect(publiclyVisibleListings).toHaveLength(0);
    },

    thenRentalStaysConfirmed(params: Place & CalendarDayRange) {
      const confirmedRentals = confirmedRentalsOf(params);
      expect(confirmedRentals).toHaveLength(1);
      expect(confirmedRentals[0].toState().period).toEqual(
        parisPeriodOfDays({ from: params.from, to: params.to }),
      );
    },

    thenNoRentedDateIsReleased(params: Place & CalendarDayRange) {
      const rentedDays = daysOf({ from: params.from, to: params.to });
      const stillRentedDays = rentedDays.filter((day) =>
        confirmedRentalsOf(params).some((confirmedRental) =>
          confirmedRental.overlaps(parisPeriodOfDays({ from: day, to: day })),
        ),
      );
      expect(stillRentedDays).toEqual(rentedDays);
    },
  };
};
