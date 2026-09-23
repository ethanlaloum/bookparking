import { Either } from 'effect/index';

import { InMemoryPublishedListingReader } from '../../../adapters/repositories/published-listing/InMemoryPublishedListingReader';
import { InMemoryRentalRepository } from '../../../adapters/repositories/rental/InMemoryRentalRepository';
import { InMemoryPaymentGateway } from '../../../adapters/services/payment-gateway/InMemoryPaymentGateway';
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
import { RequestedRental, RequestRental } from './RequestRental';

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
  const paymentGateway = new InMemoryPaymentGateway();

  const testConstants = {
    ownerNameForTest: 'Marc D.',
    renterNameForTest: 'Léa T.',
    renterIdForTest: 'account-lea',
    addressForTest: '12 rue Barla, 06300 Nice',
    boxForTest: '12',
    requestExpiryInHoursForTest: 48,
  };

  const requestRental = new RequestRental(
    publishedListingReader,
    rentalRepository,
    paymentGateway,
    testConstants.requestExpiryInHoursForTest,
  );

  const accountIdsByPersonName: Record<string, string> = {
    [testConstants.renterNameForTest]: testConstants.renterIdForTest,
  };

  const toAccountId = (personName: string): string =>
    accountIdsByPersonName[personName] ?? `account-${personName}`;

  const context = {
    publishedListingReader,
    rentalRepository,
    paymentGateway,
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
        published: true,
      };
      context.publishedListingReader.listingList.push(publishedListing);
      return { publishedListing };
    },

    givenUnpublishedListing(
      params: RentalPlace & {
        pricing: PricingForTest;
        unpublishedOn: string;
      },
    ) {
      const unpublishedListing = {
        address: params.address,
        box: params.box,
        pricing: toRentalPricing(params.pricing),
        published: false,
      };
      context.publishedListingReader.listingList.push(unpublishedListing);
      return { unpublishedListing, unpublishedOn: params.unpublishedOn };
    },

    givenPricingChangedTo(pricing: PricingForTest) {
      context.publishedListingReader.listingList =
        context.publishedListingReader.listingList.map((listing) => ({
          ...listing,
          pricing: toRentalPricing(pricing),
        }));
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

    async whenRequestedAtInstantBy(
      renterName: string,
      requestedAt: Date,
      overrides?: Partial<{ from: CalendarDay; to: CalendarDay }>,
    ) {
      return context.requestRental.execute({
        renterId: toAccountId(renterName),
        address: context.testConstants.addressForTest,
        box: context.testConstants.boxForTest,
        fromDay: overrides?.from ?? '2026-11-05',
        toDay: overrides?.to ?? '2026-11-12',
        requestedAt,
      });
    },

    async givenRequestWithoutPaymentAt(renterName: string, requestedAt: Date) {
      const result = await context.requestRental.execute({
        renterId: toAccountId(renterName),
        address: context.testConstants.addressForTest,
        box: context.testConstants.boxForTest,
        fromDay: '2026-11-05',
        toDay: '2026-11-12',
        requestedAt,
      });
      if (Either.isLeft(result))
        throw new Error('failed to arrange a request made before payments');
      context.rentalRepository.placeWithoutPayment(
        result.right.rentalRequest.id,
      );
    },

    givenStripeDoesNotAnswer() {
      context.paymentGateway.unavailable = true;
    },

    thenPaymentPageOpenedFor(
      result: Either.Either<RequestedRental, unknown>,
      expected: { amountInCents: number; expiresAt?: string },
    ) {
      expect(Either.isRight(result)).toEqual(true);
      if (Either.isLeft(result)) return;
      const opened = context.paymentGateway.openedPages;
      expect(opened).toHaveLength(1);
      expect(opened[0].requestId).toEqual(result.right.rentalRequest.id);
      expect(opened[0].amountInCents).toEqual(expected.amountInCents);
      if (expected.expiresAt !== undefined)
        expect(opened[0].expiresAt).toEqual(new Date(expected.expiresAt));
      expect(result.right.checkoutUrl).toEqual(
        `https://checkout.stripe.com/c/pay/${opened[0].checkoutSessionId}`,
      );
    },

    thenNoPaymentPageOpened() {
      expect(context.paymentGateway.openedPages).toHaveLength(0);
    },

    thenTheOnlyRequestIs(status: string) {
      const requests = context.rentalRepository.rentalRequestList;
      expect(requests).toHaveLength(1);
      expect(context.rentalRepository.statusOf(requests[0].id)).toEqual(status);
    },

    thenPendingRequestsExpired(howMany: number) {
      expect(context.rentalRepository.expiredRequestIds.size).toEqual(howMany);
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
      result: Either.Either<RequestedRental, unknown>,
      amountInCents: number,
    ) {
      expect(Either.isRight(result)).toEqual(true);
      if (Either.isRight(result)) {
        expect(result.right.rentalRequest.toState().priceInCents).toEqual(
          amountInCents,
        );
      }
    },

    thenRequestIsAccepted(result: Either.Either<RequestedRental, unknown>) {
      expect(Either.isRight(result)).toEqual(true);
    },

    thenRequestIsRecordedFor(renterName: string) {
      const recorded = context.rentalRepository.rentalRequestList;
      expect(recorded).toHaveLength(1);
      expect(recorded[0].toState().renterId).toEqual(toAccountId(renterName));
    },

    thenListingStaysPublished(place: RentalPlace) {
      const publishedListings =
        context.publishedListingReader.listingList.filter(
          (listing) =>
            listing.published &&
            listing.address === place.address &&
            listing.box === place.box,
        );
      expect(publishedListings).toHaveLength(1);
    },

    thenRequestIsRefusedWith(
      result: Either.Either<RequestedRental, unknown>,
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
      result: Either.Either<RequestedRental, unknown>,
      period: { from: string; to: string },
    ) {
      expect(Either.isRight(result)).toEqual(true);
      if (Either.isRight(result)) {
        expect(result.right.rentalRequest.toState().period).toEqual({
          from: new Date(period.from),
          to: new Date(period.to),
        });
      }
    },

    thenNoPartOfDayIsRetained(
      result: Either.Either<RequestedRental, unknown>,
      days: CalendarDay[],
    ) {
      expect(Either.isRight(result)).toEqual(true);
      if (Either.isRight(result)) {
        const period = result.right.rentalRequest.toState().period;
        const retainedDays = [parisDayOf(period.from), parisDayOf(period.to)];
        expect(retainedDays.filter((day) => days.includes(day))).toEqual([]);
      }
    },
  };
};
