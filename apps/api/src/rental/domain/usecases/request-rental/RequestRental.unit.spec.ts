import { InvalidRequestedPeriodError } from '../../errors/InvalidRequestedPeriodError';
import { DatesAlreadyRentedError } from './errors/DatesAlreadyRentedError';
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
});
