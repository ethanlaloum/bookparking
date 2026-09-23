import {
  cleanDatabase,
  startTestDatabase,
  stopTestDatabase,
} from '../../../../infra/testcontainers-setup';
import { Either } from 'effect/index';

import { DatesAlreadyRentedError } from '../../../domain/usecases/request-rental/errors/DatesAlreadyRentedError';
import { RentalRequestStatus } from './SchemaRentalRequestRepository';
import { createKnexRentalRequestRepositorySUT } from './KnexRentalRequestRepository.sut';

const PLACE = { address: '12 rue Barla, 06300 Nice', box: '12' };
const NOVEMBER = { from: '2026-11-05', to: '2026-11-12' };
const CONFIRMED_AT = new Date('2026-10-11T09:00:00.000Z');
const REQUESTED_LONG_AGO = new Date('2026-10-08T14:00:00.000Z');
const REQUESTED_SEVENTY_TWO_HOURS_LATER = new Date('2026-10-11T14:00:00.000Z');

describe('KnexRentalRequestRepository @SPEC-001', () => {
  beforeAll(async () => {
    await startTestDatabase();
  }, 120000);

  afterEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await stopTestDatabase();
  });

  it('records only one of two simultaneous requests for the same dates @EX-001-30', async () => {
    const sut = createKnexRentalRequestRepositorySUT();
    await sut.givenActiveListing({ owner: 'Marc D.', ...PLACE });

    const outcomes = await sut.whenBothRequestAtOnce(
      { renter: 'Léa T.', ...PLACE, ...NOVEMBER },
      { renter: 'Karim B.', ...PLACE, ...NOVEMBER },
    );

    await sut.thenExactlyOneRequestRowExistsFor({ ...PLACE, ...NOVEMBER });
    sut.thenExactlyOneOutcomeIsRefusedForUnavailableDates(outcomes);
  });

  it('records no request that races an unpublishing @EX-001-32', async () => {
    const sut = createKnexRentalRequestRepositorySUT();
    await sut.givenActiveListing({ owner: 'Marc D.', ...PLACE });

    const outcomes = await sut.whenRequestingWhileUnpublishing(
      { renter: 'Léa T.', ...PLACE, ...NOVEMBER },
      { owner: 'Marc D.', ...PLACE },
    );

    sut.thenRequestIsRefused(outcomes);
    sut.thenUnpublicationSucceeded(outcomes);
    await sut.thenStoredListingIsUnpublished(PLACE);
    await sut.thenNoRequestRowExistsFor({ ...PLACE, ...NOVEMBER });
  });
  it('reads the listing owner of a request by joining listings', async () => {
    const sut = createKnexRentalRequestRepositorySUT();
    await sut.givenActiveListing({ owner: 'Marc D.', ...PLACE });
    const requested = await sut.whenRequesting({
      renter: 'Léa T.',
      ...PLACE,
      ...NOVEMBER,
    });
    if (Either.isLeft(requested)) throw new Error('arrange failed');

    const summary = await sut.whenReadingSummaryOf(
      requested.right.rentalRequest.id,
    );

    expect(summary).toEqual({
      id: requested.right.rentalRequest.id,
      ownerId: 'account-marc',
      renterId: 'account-lea',
      isConfirmed: false,
      isExpired: false,
      status: 'PENDING',
      money: 'AUTHORIZED',
      paymentId: `pi_${requested.right.rentalRequest.id}`,
      checkoutSessionId: `cs_test_${requested.right.rentalRequest.id}`,
    });
  });

  it('stores the identifier the domain generated, not one Postgres defaulted', async () => {
    const sut = createKnexRentalRequestRepositorySUT();
    await sut.givenActiveListing({ owner: 'Marc D.', ...PLACE });

    const requested = await sut.whenRequesting({
      renter: 'Léa T.',
      ...PLACE,
      ...NOVEMBER,
    });
    if (Either.isLeft(requested)) throw new Error('arrange failed');

    await sut.thenStoredRequestRowIs(requested.right.rentalRequest.id, {
      status: RentalRequestStatus.PENDING,
      confirmedAt: null,
    });
  });

  it('turns a pending request into a confirmed rental readable by place', async () => {
    const sut = createKnexRentalRequestRepositorySUT();
    await sut.givenActiveListing({ owner: 'Marc D.', ...PLACE });
    const requested = await sut.whenRequesting({
      renter: 'Léa T.',
      ...PLACE,
      ...NOVEMBER,
    });
    if (Either.isLeft(requested)) throw new Error('arrange failed');

    const confirmed = await sut.whenConfirming({
      requestId: requested.right.rentalRequest.id,
      owner: 'Marc D.',
    });

    expect(Either.isRight(confirmed)).toEqual(true);
    await sut.thenStoredRequestRowIs(requested.right.rentalRequest.id, {
      status: RentalRequestStatus.CONFIRMED,
      confirmedAt: CONFIRMED_AT,
    });
    const confirmedRentals = await sut.whenReadingConfirmedRentalsFor(PLACE);
    expect(confirmedRentals).toHaveLength(1);
  });

  it('leaves a request another account tries to confirm untouched', async () => {
    const sut = createKnexRentalRequestRepositorySUT();
    await sut.givenActiveListing({ owner: 'Marc D.', ...PLACE });
    const requested = await sut.whenRequesting({
      renter: 'Léa T.',
      ...PLACE,
      ...NOVEMBER,
    });
    if (Either.isLeft(requested)) throw new Error('arrange failed');

    const refused = await sut.whenConfirming({
      requestId: requested.right.rentalRequest.id,
      owner: 'Karim B.',
    });

    expect(Either.isLeft(refused)).toEqual(true);
    await sut.thenStoredRequestRowIs(requested.right.rentalRequest.id, {
      status: RentalRequestStatus.PENDING,
      confirmedAt: null,
    });
    expect(await sut.whenReadingConfirmedRentalsFor(PLACE)).toEqual([]);
  });
  it('frees dates a stale pending request had frozen, and marks it expired', async () => {
    const sut = createKnexRentalRequestRepositorySUT();
    await sut.givenActiveListing({ owner: 'Marc D.', ...PLACE });
    const stale = await sut.whenRequestingAt(
      { renter: 'Léa T.', ...PLACE, ...NOVEMBER },
      REQUESTED_LONG_AGO,
    );
    if (Either.isLeft(stale)) throw new Error('arrange failed');

    const fresh = await sut.whenRequestingAt(
      { renter: 'Karim B.', ...PLACE, ...NOVEMBER },
      REQUESTED_SEVENTY_TWO_HOURS_LATER,
    );

    expect(Either.isRight(fresh)).toEqual(true);
    await sut.thenStoredRequestRowIs(stale.right.rentalRequest.id, {
      status: RentalRequestStatus.EXPIRED,
      confirmedAt: null,
    });
  });

  it('keeps a confirmed rental frozen however old it is', async () => {
    const sut = createKnexRentalRequestRepositorySUT();
    await sut.givenActiveListing({ owner: 'Marc D.', ...PLACE });
    const old = await sut.whenRequestingAt(
      { renter: 'Léa T.', ...PLACE, ...NOVEMBER },
      REQUESTED_LONG_AGO,
    );
    if (Either.isLeft(old)) throw new Error('arrange failed');
    await sut.whenConfirming({
      requestId: old.right.rentalRequest.id,
      owner: 'Marc D.',
    });

    const fresh = await sut.whenRequestingAt(
      { renter: 'Karim B.', ...PLACE, ...NOVEMBER },
      REQUESTED_SEVENTY_TWO_HOURS_LATER,
    );

    expect(Either.isLeft(fresh)).toEqual(true);
    await sut.thenStoredRequestRowIs(old.right.rentalRequest.id, {
      status: RentalRequestStatus.CONFIRMED,
      confirmedAt: CONFIRMED_AT,
    });
  });
});

describe('KnexRentalRequestRepository @SPEC-004', () => {
  const BARLA = { address: '12 rue Barla, 06300 Nice', box: '12' };
  const LEA_DAYS = { from: '2026-10-10', to: '2026-10-12' };
  const PAUL_DAYS = { from: '2026-10-11', to: '2026-10-13' };
  const LEA_ASKS_AT = new Date('2026-10-01T07:00:00.000Z');
  const PAUL_ASKS_AT = new Date('2026-10-01T07:10:00.000Z');

  beforeAll(async () => {
    await startTestDatabase();
  }, 120000);

  afterEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await stopTestDatabase();
  });

  it('refuses a second request on dates still awaiting payment @EX-004-07', async () => {
    const sut = createKnexRentalRequestRepositorySUT();
    await sut.givenActiveListing({ owner: 'Marc D.', ...BARLA });
    await sut.whenRequestingWithoutPaying(
      { renter: 'Léa T.', ...BARLA, ...LEA_DAYS },
      LEA_ASKS_AT,
    );

    const paul = await sut.whenRequestingWithoutPaying(
      { renter: 'Paul R.', ...BARLA, ...PAUL_DAYS },
      PAUL_ASKS_AT,
    );

    expect(Either.isLeft(paul) && paul.left).toBeInstanceOf(
      DatesAlreadyRentedError,
    );
    expect(await sut.thenRequestRowsFor(BARLA)).toEqual([
      { renter_id: 'account-lea', status: 'AWAITING_PAYMENT' },
    ]);
  });

  it('frees the dates of an abandoned request @EX-004-15', async () => {
    const sut = createKnexRentalRequestRepositorySUT();
    await sut.givenActiveListing({ owner: 'Marc D.', ...BARLA });
    const lea = await sut.whenRequestingWithoutPaying(
      { renter: 'Léa T.', ...BARLA, ...LEA_DAYS },
      LEA_ASKS_AT,
    );
    if (Either.isLeft(lea)) throw new Error('arrange failed');
    await sut.repository().markAbandoned(lea.right.rentalRequest.id);

    const paul = await sut.whenRequestingWithoutPaying(
      { renter: 'Paul R.', ...BARLA, ...PAUL_DAYS },
      PAUL_ASKS_AT,
    );

    expect(Either.isRight(paul)).toEqual(true);
  });

  it('frees the dates of a request whose capture the bank declined @EX-004-24', async () => {
    const sut = createKnexRentalRequestRepositorySUT();
    await sut.givenActiveListing({ owner: 'Marc D.', ...BARLA });
    const lea = await sut.whenRequesting({
      renter: 'Léa T.',
      ...BARLA,
      ...LEA_DAYS,
    });
    if (Either.isLeft(lea)) throw new Error('arrange failed');
    await sut.repository().markPaymentFailed(lea.right.rentalRequest.id);

    const paul = await sut.whenRequestingWithoutPaying(
      { renter: 'Paul R.', ...BARLA, ...PAUL_DAYS },
      PAUL_ASKS_AT,
    );

    expect(Either.isRight(paul)).toEqual(true);
    await sut.thenStoredMoneyRowIs(lea.right.rentalRequest.id, {
      status: 'PAYMENT_FAILED',
      money: 'RELEASE_DUE',
    });
  });

  it('writes the expiry and the release owed on the same row, in one statement @EX-004-35', async () => {
    const sut = createKnexRentalRequestRepositorySUT();
    await sut.givenActiveListing({ owner: 'Marc D.', ...BARLA });
    const lea = await sut.whenRequestingWithoutPaying(
      { renter: 'Léa T.', ...BARLA, ...LEA_DAYS },
      LEA_ASKS_AT,
    );
    if (Either.isLeft(lea)) throw new Error('arrange failed');
    const id = lea.right.rentalRequest.id;
    await sut
      .repository()
      .markHoldPlaced(id, 'pi_lea', new Date('2026-10-01T07:05:00.000Z'));

    const expired = await sut
      .repository()
      .expireHoldsPlacedSince(new Date('2026-10-01T07:05:00.000Z'));

    expect(expired).toEqual(1);
    await sut.thenStoredMoneyRowIs(id, {
      status: 'EXPIRED',
      money: 'RELEASE_DUE',
    });
    expect(await sut.repository().findMoneyOwed()).toEqual([
      {
        requestId: id,
        paymentId: 'pi_lea',
        owed: 'RELEASE_DUE',
        status: 'EXPIRED',
      },
    ]);
  });
});
