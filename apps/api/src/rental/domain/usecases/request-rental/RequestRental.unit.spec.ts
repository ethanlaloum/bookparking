import { InvalidRequestedPeriodError } from '../../errors/InvalidRequestedPeriodError';
import { NoPriceForRequestedPeriodError } from '../../errors/NoPriceForRequestedPeriodError';
import { PaymentUnavailableError } from '../../errors/PaymentUnavailableError';
import { DatesAlreadyRentedError } from './errors/DatesAlreadyRentedError';
import { ListingNotPublishedError } from './errors/ListingNotPublishedError';
import { RequestedPeriodTooLongError } from '../../errors/RequestedPeriodTooLongError';
import { createRequestRentalSUT } from './RequestRental.sut';

const PLACE = { address: '12 rue Barla, 06300 Nice', box: '12' };
const LEA = 'Léa T.';

describe('RequestRental @SPEC-001', () => {
  it('keeps the price of a request made before the pricing changed @EX-001-22', async () => {
    const sut = createRequestRentalSUT();
    sut.givenListing({
      ...PLACE,
      pricing: { day: null, week: null, month: 18000 },
    });

    const firstRequest = await sut.whenRequestedBy(LEA, {
      ...PLACE,
      from: '2026-10-01',
      to: '2026-10-31',
      requestedAt: '2026-10-01',
    });

    sut.givenPricingChangedTo({ day: null, week: null, month: 20000 });

    const secondRequest = await sut.whenRequestedBy(LEA, {
      ...PLACE,
      from: '2026-10-01',
      to: '2026-10-31',
      requestedAt: '2026-10-03',
    });

    sut.thenPriceIs(firstRequest, 18000);
    sut.thenPriceIs(secondRequest, 20000);
  });

  it('accepts a request for free dates after the current rental @EX-001-09', async () => {
    const sut = createRequestRentalSUT();
    sut.givenListing({
      ...PLACE,
      pricing: { day: 1200, week: 6000, month: 18000 },
    });
    sut.givenRentedPeriod({ ...PLACE, from: '2026-10-01', to: '2026-10-31' });

    const result = await sut.whenRequestedBy(LEA, {
      ...PLACE,
      from: '2026-11-05',
      to: '2026-11-12',
      requestedAt: '2026-11-01',
    });

    sut.thenRequestIsAccepted(result);
    sut.thenListingStaysPublished(PLACE);
  });

  it('refuses a request overlapping already rented dates @EX-001-10', async () => {
    const sut = createRequestRentalSUT();
    sut.givenListing({
      ...PLACE,
      pricing: { day: 1200, week: 6000, month: 18000 },
    });
    sut.givenRentedPeriod({ ...PLACE, from: '2026-10-01', to: '2026-10-31' });

    const result = await sut.whenRequestedBy(LEA, {
      ...PLACE,
      from: '2026-10-15',
      to: '2026-10-20',
      requestedAt: '2026-10-14',
    });

    sut.thenRequestIsRefusedWith(result, DatesAlreadyRentedError);
    sut.thenNoRequestRecordedFor({ from: '2026-10-15', to: '2026-10-20' });
  });

  it('refuses a request starting on the last rented day @EX-001-28', async () => {
    const sut = createRequestRentalSUT();
    sut.givenListing({
      ...PLACE,
      pricing: { day: 1200, week: 6000, month: 18000 },
    });
    sut.givenRentedPeriod({ ...PLACE, from: '2026-10-01', to: '2026-10-31' });

    const result = await sut.whenRequestedBy(LEA, {
      ...PLACE,
      from: '2026-10-31',
      to: '2026-11-05',
      requestedAt: '2026-10-30',
    });

    sut.thenRequestIsRefusedWith(result, DatesAlreadyRentedError);
    sut.thenNoRequestRecordedFor({ from: '2026-10-31', to: '2026-11-05' });
  });

  it('bounds a requested day on the Europe/Paris calendar day @EX-001-29', async () => {
    const sut = createRequestRentalSUT();
    sut.givenListing({
      ...PLACE,
      pricing: { day: 1200, week: 6000, month: 18000 },
    });
    sut.givenNoConfirmedRental();

    const result = await sut.whenDayRequestedBy(LEA, {
      ...PLACE,
      day: '2026-10-15',
      requestedAt: '2026-10-14T20:00:00',
      timezone: 'America/New_York',
    });

    sut.thenRequestedPeriodIs(result, {
      from: '2026-10-15T00:00:00+02:00',
      to: '2026-10-15T23:59:59.999+02:00',
    });
    sut.thenNoPartOfDayIsRetained(result, ['2026-10-14', '2026-10-16']);
  });

  it('refuses a request longer than the maximum rental period @EX-001-40', async () => {
    const sut = createRequestRentalSUT();
    sut.givenListing({
      ...PLACE,
      pricing: { day: null, week: null, month: 18000 },
    });
    sut.givenNoConfirmedRental();

    const result = await sut.whenRequestedBy(LEA, {
      ...PLACE,
      from: '2026-01-01',
      to: '9999-12-31',
      requestedAt: '2025-12-31',
    });

    sut.thenRequestIsRefusedWith(result, RequestedPeriodTooLongError);
    sut.thenNoRequestRecordedFor({ from: '2026-01-01', to: '9999-12-31' });
  });

  it('refuses a request whose dates cannot be read @EX-001-41', async () => {
    const sut = createRequestRentalSUT();
    sut.givenListing({
      ...PLACE,
      pricing: { day: 1200, week: 6000, month: 18000 },
    });
    sut.givenRentedPeriod({ ...PLACE, from: '2026-10-01', to: '2026-10-31' });

    const result = await sut.whenRequestedBy(LEA, {
      ...PLACE,
      from: '2026-10-01',
      to: '2026-13-45',
      requestedAt: '2026-09-20',
    });

    sut.thenRequestIsRefusedWith(result, InvalidRequestedPeriodError);
    sut.thenNoRequestRecordedFor({ from: '2026-10-01', to: '2026-13-45' });
  });

  it('refuses a request on an unpublished listing @EX-001-31', async () => {
    const sut = createRequestRentalSUT();
    sut.givenUnpublishedListing({
      ...PLACE,
      pricing: { day: 1200, week: 6000, month: 18000 },
      unpublishedOn: '2026-10-10',
    });

    const result = await sut.whenRequestedBy(LEA, {
      ...PLACE,
      from: '2026-11-05',
      to: '2026-11-12',
      requestedAt: '2026-10-11',
    });

    sut.thenRequestIsRefusedWith(result, ListingNotPublishedError);
    sut.thenNoRequestRecordedFor({ from: '2026-11-05', to: '2026-11-12' });
  });
});

describe('RequestRental @SPEC-002', () => {
  it('records a rental request for an account that already publishes @EX-002-20', async () => {
    const sut = createRequestRentalSUT();
    const OTHER_PLACE = {
      address: '3 avenue Malausséna, 06000 Nice',
      box: '4',
    };
    sut.givenListing({
      ...OTHER_PLACE,
      pricing: { day: 1200, week: 6000, month: 18000 },
    });

    const result = await sut.whenRequestedBy('Marc D.', {
      ...OTHER_PLACE,
      from: '2026-10-01',
      to: '2026-10-03',
      requestedAt: '2026-09-25',
    });

    sut.thenRequestIsAccepted(result);
    sut.thenRequestIsRecordedFor('Marc D.');
  });
  describe('expiry of stale pending requests', () => {
    const PLACE_FOR_EXPIRY = {
      address: '12 rue Barla, 06300 Nice',
      box: '12',
    };
    const FIRST_REQUEST_AT = new Date('2026-10-01T08:00:00.000Z');
    const EXACTLY_FORTY_EIGHT_HOURS_LATER = new Date(
      '2026-10-03T08:00:00.000Z',
    );
    const ONE_MILLISECOND_PAST_FORTY_EIGHT_HOURS = new Date(
      '2026-10-03T08:00:00.001Z',
    );

    const arrange = () => {
      const sut = createRequestRentalSUT();
      sut.givenListing({ ...PLACE_FOR_EXPIRY, pricing: { day: 1000 } });
      return sut;
    };

    it('keeps a request made exactly at the deadline alive', async () => {
      const sut = arrange();
      await sut.givenRequestWithoutPaymentAt('Léa T.', FIRST_REQUEST_AT);

      await sut.whenRequestedAtInstantBy(
        'Karim B.',
        EXACTLY_FORTY_EIGHT_HOURS_LATER,
        { from: '2026-12-01', to: '2026-12-02' },
      );

      sut.thenPendingRequestsExpired(0);
    });

    it('expires a request one millisecond past the deadline', async () => {
      const sut = arrange();
      await sut.givenRequestWithoutPaymentAt('Léa T.', FIRST_REQUEST_AT);

      await sut.whenRequestedAtInstantBy(
        'Karim B.',
        ONE_MILLISECOND_PAST_FORTY_EIGHT_HOURS,
        { from: '2026-12-01', to: '2026-12-02' },
      );

      sut.thenPendingRequestsExpired(1);
    });
  });
});

describe('RequestRental @SPEC-004', () => {
  const BARLA = { address: '12 rue Barla, 06300 Nice', box: '12' };
  const LEA_ASKS_AT = new Date('2026-10-01T07:00:00.000Z');
  const THREE_DAYS = { from: '2026-10-10', to: '2026-10-12' } as const;

  it('opens a card hold for the price the api froze @EX-004-01', async () => {
    const sut = createRequestRentalSUT();
    sut.givenListing({
      ...BARLA,
      pricing: { day: 1500, week: null, month: null },
    });

    const result = await sut.whenRequestedAtInstantBy(
      'Léa T.',
      LEA_ASKS_AT,
      THREE_DAYS,
    );

    sut.thenPaymentPageOpenedFor(result, { amountInCents: 4500 });
  });

  it('opens no payment page for a period no price covers @EX-004-03', async () => {
    const sut = createRequestRentalSUT();
    sut.givenListing({
      ...BARLA,
      pricing: { day: null, week: 8000, month: null },
    });

    const result = await sut.whenRequestedAtInstantBy(
      'Léa T.',
      LEA_ASKS_AT,
      THREE_DAYS,
    );

    sut.thenRequestIsRefusedWith(result, NoPriceForRequestedPeriodError);
    sut.thenNoPaymentPageOpened();
  });

  it('lets the payment page expire thirty minutes after the request @EX-004-08', async () => {
    const sut = createRequestRentalSUT();
    sut.givenListing({
      ...BARLA,
      pricing: { day: 1500, week: null, month: null },
    });

    const result = await sut.whenRequestedAtInstantBy(
      'Léa T.',
      LEA_ASKS_AT,
      THREE_DAYS,
    );

    sut.thenPaymentPageOpenedFor(result, {
      amountInCents: 4500,
      expiresAt: '2026-10-01T07:30:00.000Z',
    });
  });

  it('abandons the request and frees its dates when Stripe does not answer @EX-004-09', async () => {
    const sut = createRequestRentalSUT();
    sut.givenListing({
      ...BARLA,
      pricing: { day: 1500, week: null, month: null },
    });
    sut.givenStripeDoesNotAnswer();

    const result = await sut.whenRequestedAtInstantBy(
      'Léa T.',
      LEA_ASKS_AT,
      THREE_DAYS,
    );

    sut.thenRequestIsRefusedWith(result, PaymentUnavailableError);
    sut.thenTheOnlyRequestIs('ABANDONED');
  });
});
