import { Either } from 'effect/index';

import { InMemoryPublishedListingReader } from '../../../adapters/repositories/published-listing/InMemoryPublishedListingReader';
import { InMemoryRentalRepository } from '../../../adapters/repositories/rental/InMemoryRentalRepository';
import { ConfirmedRentalBuilder } from '../../builders/ConfirmedRentalBuilder';
import {
  CalendarDay,
  CalendarDayRange,
  isReadableDayRange,
  parisDayOf,
  parisPeriodOfDays,
  zonedTimeToUtc,
} from '../../entities/CalendarDay';
import { RentalPlace } from '../../entities/RentalPlace';
import { RentalRequest } from '../../entities/RentalRequest';
import { RequestRental } from './RequestRental';

interface PricingForTest {
  day: number | null;
  week: number | null;
  month: number | null;
}

interface RentalRequestInput extends RentalPlace {
  from: CalendarDay;
  to: CalendarDay;
  requestedAt: string;
}

interface DayRentalRequestInput extends RentalPlace {
  day: CalendarDay;
  requestedAt: string;
  timezone: string;
}

// parisPeriodOfDays throws on a day Date.parse cannot read, so an unreadable
// range is matched on the days the request carries rather than on a period.
const coversRequestedDays = (
  rentalRequest: RentalRequest,
  days: CalendarDayRange,
): boolean => {
  const requestedDays = rentalRequest.toState().days;
  if (requestedDays.from === days.from && requestedDays.to === days.to)
    return true;

  return (
    isReadableDayRange(days) && rentalRequest.overlaps(parisPeriodOfDays(days))
  );
};

const toRentalPricing = (pricing: PricingForTest) => ({
  dayInCents: pricing.day,
  weekInCents: pricing.week,
  monthInCents: pricing.month,
});

export const createRequestRentalSUT = () => {
  const publishedListingReader = new InMemoryPublishedListingReader();
  const rentalRepository = new InMemoryRentalRepository();

  const testConstants = {
    ownerNameForTest: 'Marc D.',
    renterNameForTest: 'Léa T.',
    renterIdForTest: 'account-lea',
    addressForTest: '12 rue Barla, 06300 Nice',
    boxForTest: '12',
  };

  const requestRental = new RequestRental(
    publishedListingReader,
    rentalRepository,
  );

  const accountIdsByPersonName: Record<string, string> = {
    [testConstants.renterNameForTest]: testConstants.renterIdForTest,
  };

  const toAccountId = (personName: string): string =>
    accountIdsByPersonName[personName] ?? `account-${personName}`;

  const context = {
    publishedListingReader,
    rentalRepository,
    requestRental,
    testConstants,
  };

  return {
    context,

    givenListing(params: RentalPlace & { pricing: PricingForTest }) {
      const publishedListing = {
        address: params.address,
        box: params.box,
        pricing: toRentalPricing(params.pricing),
      };
      context.publishedListingReader.publishedListingList.push(
        publishedListing,
      );
      return { publishedListing };
    },

    givenPricingChangedTo(pricing: PricingForTest) {
      context.publishedListingReader.publishedListingList =
        context.publishedListingReader.publishedListingList.map(
          (publishedListing) => ({
            ...publishedListing,
            pricing: toRentalPricing(pricing),
          }),
        );
    },

    givenRentedPeriod(
      params: RentalPlace & { from: CalendarDay; to: CalendarDay },
    ) {
      const confirmedRental = new ConfirmedRentalBuilder()
        .withAddress(params.address)
        .withBox(params.box)
        .withDays({ from: params.from, to: params.to })
        .build();
      context.rentalRepository.confirmedRentalList.push(confirmedRental);
      return { confirmedRental };
    },

    givenNoConfirmedRental() {
      context.rentalRepository.confirmedRentalList = [];
    },

    async whenRequestedBy(
      renterName: string,
      overrides?: Partial<RentalRequestInput>,
    ) {
      const defaults: RentalRequestInput = {
        address: context.testConstants.addressForTest,
        box: context.testConstants.boxForTest,
        from: '2026-11-05',
        to: '2026-11-12',
        requestedAt: '2026-11-01',
      };
      const input = { ...defaults, ...overrides };

      return context.requestRental.execute({
        renterId: toAccountId(renterName),
        address: input.address,
        box: input.box,
        fromDay: input.from,
        toDay: input.to,
        requestedAt: new Date(`${input.requestedAt}T00:00:00.000Z`),
      });
    },

    async whenDayRequestedBy(
      renterName: string,
      overrides?: Partial<DayRentalRequestInput>,
    ) {
      const defaults: DayRentalRequestInput = {
        address: context.testConstants.addressForTest,
        box: context.testConstants.boxForTest,
        day: '2026-10-15',
        requestedAt: '2026-10-14T20:00:00',
        timezone: 'America/New_York',
      };
      const input = { ...defaults, ...overrides };

      return context.requestRental.execute({
        renterId: toAccountId(renterName),
        address: input.address,
        box: input.box,
        fromDay: input.day,
        toDay: input.day,
        requestedAt: zonedTimeToUtc(input.requestedAt, input.timezone),
      });
    },

    thenPriceIs(
      result: Either.Either<RentalRequest, unknown>,
      amountInCents: number,
    ) {
      expect(Either.isRight(result)).toEqual(true);
      if (Either.isRight(result)) {
        expect(result.right.toState().priceInCents).toEqual(amountInCents);
      }
    },

    thenRequestIsAccepted(result: Either.Either<RentalRequest, unknown>) {
      expect(Either.isRight(result)).toEqual(true);
    },

    thenListingStaysPublished(place: RentalPlace) {
      const publishedListings =
        context.publishedListingReader.publishedListingList.filter(
          (publishedListing) =>
            publishedListing.address === place.address &&
            publishedListing.box === place.box,
        );
      expect(publishedListings).toHaveLength(1);
    },

    thenRequestIsRefusedWith(
      result: Either.Either<RentalRequest, unknown>,
      ErrorClass: new (...args: never[]) => Error,
    ) {
      expect(Either.isLeft(result)).toEqual(true);
      if (Either.isLeft(result)) {
        expect(result.left).toBeInstanceOf(ErrorClass);
      }
    },

    thenNoRequestRecordedFor(days: CalendarDayRange) {
      const recordedRequests =
        context.rentalRepository.rentalRequestList.filter((rentalRequest) =>
          coversRequestedDays(rentalRequest, days),
        );
      expect(recordedRequests).toHaveLength(0);
    },

    thenRequestedPeriodIs(
      result: Either.Either<RentalRequest, unknown>,
      period: { from: string; to: string },
    ) {
      expect(Either.isRight(result)).toEqual(true);
      if (Either.isRight(result)) {
        expect(result.right.toState().period).toEqual({
          from: new Date(period.from),
          to: new Date(period.to),
        });
      }
    },

    thenNoPartOfDayIsRetained(
      result: Either.Either<RentalRequest, unknown>,
      days: CalendarDay[],
    ) {
      expect(Either.isRight(result)).toEqual(true);
      if (Either.isRight(result)) {
        const period = result.right.toState().period;
        const retainedDays = [parisDayOf(period.from), parisDayOf(period.to)];
        expect(retainedDays.filter((day) => days.includes(day))).toEqual([]);
      }
    },
  };
};
