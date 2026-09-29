import { InvalidRequestedPeriodError } from '../../errors/InvalidRequestedPeriodError';
import { NoPriceForRequestedPeriodError } from '../../errors/NoPriceForRequestedPeriodError';
import { PaymentUnavailableError } from '../../errors/PaymentUnavailableError';
import { IdempotencyKeyReusedError } from './errors/IdempotencyKeyReusedError';
import { DatesAlreadyRentedError } from './errors/DatesAlreadyRentedError';
import { ListingNotPublishedError } from './errors/ListingNotPublishedError';
import { ListingClosedOnRequestedDaysError } from './errors/ListingClosedOnRequestedDaysError';
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

    it('keeps the answer delay frozen on a request when the back office shortens it', async () => {
      const sut = arrange();
      await sut.givenRequestWithoutPaymentAt('Léa T.', FIRST_REQUEST_AT);
      sut.givenBackOfficeSettings({ requestExpiryHours: 1 });

      await sut.whenRequestedAtInstantBy(
        'Karim B.',
        new Date('2026-10-01T10:00:00.000Z'),
        { from: '2026-12-01', to: '2026-12-02' },
      );

      sut.thenPendingRequestsExpired(0);
    });

    it('expires a request on the shorter delay it was made under, whatever the setting now says', async () => {
      const sut = arrange();
      sut.givenBackOfficeSettings({ requestExpiryHours: 1 });
      await sut.givenRequestWithoutPaymentAt('Léa T.', FIRST_REQUEST_AT);
      sut.givenBackOfficeSettings({ requestExpiryHours: 48 });

      await sut.whenRequestedAtInstantBy(
        'Karim B.',
        new Date('2026-10-01T09:00:00.001Z'),
        { from: '2026-12-01', to: '2026-12-02' },
      );

      sut.thenPendingRequestsExpired(1);
    });

    it('tells the renter and the owner of the request it expires', async () => {
      const sut = arrange();
      const lapsed = await sut.givenRequestWithoutPaymentAt(
        'Léa T.',
        FIRST_REQUEST_AT,
      );

      await sut.whenRequestedAtInstantBy(
        'Karim B.',
        ONE_MILLISECOND_PAST_FORTY_EIGHT_HOURS,
        { from: '2026-12-01', to: '2026-12-02' },
      );

      sut.thenNotificationsAre([
        {
          kind: 'RENTAL_REQUEST_EXPIRED',
          recipientId: 'account-lea',
          requestId: lapsed,
        },
        {
          kind: 'RENTAL_REQUEST_UNANSWERED',
          recipientId: 'account-Marc D.',
          requestId: lapsed,
        },
      ]);
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

describe('RequestRental, one request per intent @SPEC-004', () => {
  const BARLA = { address: '12 rue Barla, 06300 Nice', box: '12' };
  const MALAUSSENA = { address: '3 avenue Malausséna, 06000 Nice', box: '4' };
  const DAY_PRICE = { day: 1500, week: null, month: null };
  const K1 = '9d3c1b2a-0f4e-4a5b-8c6d-7e8f9a0b1c2d';

  it('answers the same request when the same intent is sent twice @EX-004-42', async () => {
    const sut = createRequestRentalSUT();
    sut.givenListing({ ...BARLA, pricing: DAY_PRICE });
    const intent = {
      renterName: 'Léa T.',
      idempotencyKey: K1,
      place: BARLA,
      from: '2026-10-10',
      to: '2026-10-12',
    };

    const first = await sut.whenRequestingUnderIntent(intent);
    const second = await sut.whenRequestingUnderIntent(intent);

    sut.thenRecordedRequestCountIs(1);
    sut.thenPaymentPagesOpenedCountIs(1);
    sut.thenBothAnswersAreTheSame(first, second);
  });

  it('refuses an intent identifier reused for another period or another place @EX-004-43', async () => {
    const sut = createRequestRentalSUT();
    sut.givenListing({ ...BARLA, pricing: DAY_PRICE });
    sut.givenListing({ ...MALAUSSENA, pricing: DAY_PRICE });
    await sut.whenRequestingUnderIntent({
      renterName: 'Léa T.',
      idempotencyKey: K1,
      place: BARLA,
      from: '2026-10-10',
      to: '2026-10-12',
    });

    const reused = await sut.whenRequestingUnderIntent({
      renterName: 'Léa T.',
      idempotencyKey: K1,
      place: BARLA,
      from: '2026-10-20',
      to: '2026-10-22',
    });

    const otherPlace = await sut.whenRequestingUnderIntent({
      renterName: 'Léa T.',
      idempotencyKey: K1,
      place: MALAUSSENA,
      from: '2026-10-10',
      to: '2026-10-12',
    });

    sut.thenRequestIsRefusedWith(reused, IdempotencyKeyReusedError);
    sut.thenRequestIsRefusedWith(otherPlace, IdempotencyKeyReusedError);
    sut.thenRecordedRequestCountIs(1);
  });

  it('never answers another account request under the same identifier @EX-004-44', async () => {
    const sut = createRequestRentalSUT();
    sut.givenListing({ ...BARLA, pricing: DAY_PRICE });
    sut.givenListing({ ...MALAUSSENA, pricing: DAY_PRICE });
    const lea = await sut.whenRequestingUnderIntent({
      renterName: 'Léa T.',
      idempotencyKey: K1,
      place: BARLA,
      from: '2026-10-10',
      to: '2026-10-12',
    });

    const paul = await sut.whenRequestingUnderIntent({
      renterName: 'Paul R.',
      idempotencyKey: K1,
      place: MALAUSSENA,
      from: '2026-10-10',
      to: '2026-10-12',
    });

    sut.thenRecordedRequestCountIs(2);
    sut.thenTheAnswersDiffer(lea, paul);
  });

  it('does not spend the identifier on an attempt Stripe could not open @EX-004-45', async () => {
    const sut = createRequestRentalSUT();
    sut.givenListing({ ...BARLA, pricing: DAY_PRICE });
    const intent = {
      renterName: 'Léa T.',
      idempotencyKey: K1,
      place: BARLA,
      from: '2026-10-10',
      to: '2026-10-12',
    };
    sut.givenStripeDoesNotAnswer();
    const refused = await sut.whenRequestingUnderIntent(intent);
    sut.thenRequestIsRefusedWith(refused, PaymentUnavailableError);

    sut.givenStripeAnswersAgain();
    const retried = await sut.whenRequestingUnderIntent(intent);

    sut.thenPaymentPageOpenedFor(retried, { amountInCents: 4500 });
  });
});

describe('RequestRental, never blocked by one own unpaid request @SPEC-004', () => {
  const BARLA = { address: '12 rue Barla, 06300 Nice', box: '12' };

  it('replaces its own unpaid request when asking the same place again @EX-004-50', async () => {
    const sut = createRequestRentalSUT();
    sut.givenListing({
      ...BARLA,
      pricing: { day: 1500, week: null, month: null },
    });
    const first = await sut.whenRequestingUnderIntent({
      renterName: 'Léa T.',
      idempotencyKey: '11111111-1111-4111-8111-111111111111',
      place: BARLA,
      from: '2026-10-10',
      to: '2026-10-12',
    });

    const second = await sut.whenRequestingUnderIntent({
      renterName: 'Léa T.',
      idempotencyKey: '22222222-2222-4222-8222-222222222222',
      place: BARLA,
      from: '2026-10-11',
      to: '2026-10-13',
    });

    sut.thenTheRequestIs(first, 'ABANDONED');
    sut.thenItsPaymentPageWasClosed(first);
    sut.thenTheRequestIs(second, 'AWAITING_PAYMENT');
  });
});

describe('RequestRental — platform fee', () => {
  it('freezes the fifteen per cent commission on the request, to the nearest cent', async () => {
    const sut = createRequestRentalSUT();
    sut.givenListing({
      address: '12 rue Barla, 06300 Nice',
      box: '12',
      pricing: { day: 1333, week: null, month: null },
    });

    await sut.whenRequestedBy('Léa T.', {
      address: '12 rue Barla, 06300 Nice',
      box: '12',
      from: '2026-10-10',
      to: '2026-10-12',
      requestedAt: '2026-10-01',
    });

    // 3 jours × 13,33 € = 39,99 € ; 15 % = 5,9985 €, soit 6,00 €.
    sut.thenPlatformFeeInCentsIs(600);
  });
});

describe('RequestRental — the back-office settings frozen on the request', () => {
  it('freezes the commission, the free cancellation deadline and both delays in force', async () => {
    const sut = createRequestRentalSUT();
    sut.givenListing({
      address: '12 rue Barla, 06300 Nice',
      box: '12',
      pricing: { day: 1333, week: null, month: null },
    });
    sut.givenBackOfficeSettings({
      platformFeePercent: 12.5,
      freeCancellationHours: 48,
      requestExpiryHours: 24,
      payoutReleaseDelayHours: 72,
    });

    await sut.whenRequestedBy('Léa T.', {
      address: '12 rue Barla, 06300 Nice',
      box: '12',
      from: '2026-10-10',
      to: '2026-10-12',
      requestedAt: '2026-10-01',
    });

    // 39,99 € × 12,5 % = 4,99875 €, soit 5,00 € ; le 10 octobre commence à
    // minuit à Paris, 22 h la veille en UTC, et 48 heures plus tôt c'est le 7.
    sut.thenFrozenTermsAre({
      platformFeeInCents: 500,
      freeCancellationUntil: '2026-10-07T22:00:00.000Z',
      requestExpiryHours: 24,
      payoutReleaseDelayHours: 72,
    });
  });
});

describe('RequestRental — the days the place is open', () => {
  const OCTOBER = { from: '2026-10-01', to: '2026-10-31' };
  const CLOSED = "La place n'est pas ouverte sur toute la période demandée";

  const givenOpenInOctober = () => {
    const sut = createRequestRentalSUT();
    sut.givenListing({
      ...PLACE,
      pricing: { day: 1500, week: null, month: null },
      openDays: OCTOBER,
    });
    return sut;
  };

  it('accepts a stay from the first open day to the last one', async () => {
    const sut = givenOpenInOctober();

    const result = await sut.whenRequestedBy(LEA, {
      from: '2026-10-01',
      to: '2026-10-31',
      requestedAt: '2026-09-20',
    });

    sut.thenRequestedPeriodIs(result, {
      from: '2026-09-30T22:00:00.000Z',
      to: '2026-10-31T22:59:59.999Z',
    });
    sut.thenRecordedRequestsAre([
      {
        renterId: 'account-lea',
        days: { from: '2026-10-01', to: '2026-10-31' },
      },
    ]);
  });

  it('refuses a stay that begins the day before the place opens, and opens no payment page', async () => {
    const sut = givenOpenInOctober();

    const result = await sut.whenRequestedBy(LEA, {
      from: '2026-09-30',
      to: '2026-10-02',
      requestedAt: '2026-09-20',
    });

    sut.thenRequestIsRefusedWith(result, ListingClosedOnRequestedDaysError);
    sut.thenRefusalMessageIs(result, CLOSED);
    sut.thenRecordedRequestsAre([]);
    sut.thenNoPaymentPageOpened();
  });

  it('refuses a stay that ends the day after the place closes', async () => {
    const sut = givenOpenInOctober();

    const result = await sut.whenRequestedBy(LEA, {
      from: '2026-10-30',
      to: '2026-11-01',
      requestedAt: '2026-09-20',
    });

    sut.thenRequestIsRefusedWith(result, ListingClosedOnRequestedDaysError);
    sut.thenRefusalMessageIs(result, CLOSED);
    sut.thenRecordedRequestsAre([]);
  });

  it('still refuses a departure before the arrival as an unreadable period, not as a closed place', async () => {
    const sut = givenOpenInOctober();

    const result = await sut.whenRequestedBy(LEA, {
      from: '2026-11-12',
      to: '2026-11-10',
      requestedAt: '2026-09-20',
    });

    sut.thenRequestIsRefusedWith(result, InvalidRequestedPeriodError);
    sut.thenRecordedRequestsAre([]);
  });
});
