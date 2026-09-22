import {
  cleanDatabase,
  startTestDatabase,
  stopTestDatabase,
} from '../../../../infra/testcontainers-setup';
import { Either } from 'effect/index';

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

    const summary = await sut.whenReadingSummaryOf(requested.right.id);

    expect(summary).toEqual({
      id: requested.right.id,
      ownerId: 'account-marc',
      renterId: 'account-lea',
      isConfirmed: false,
      isExpired: false,
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

    await sut.thenStoredRequestRowIs(requested.right.id, {
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
      requestId: requested.right.id,
      owner: 'Marc D.',
    });

    expect(Either.isRight(confirmed)).toEqual(true);
    await sut.thenStoredRequestRowIs(requested.right.id, {
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
      requestId: requested.right.id,
      owner: 'Karim B.',
    });

    expect(Either.isLeft(refused)).toEqual(true);
    await sut.thenStoredRequestRowIs(requested.right.id, {
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
    await sut.thenStoredRequestRowIs(stale.right.id, {
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
    await sut.whenConfirming({ requestId: old.right.id, owner: 'Marc D.' });

    const fresh = await sut.whenRequestingAt(
      { renter: 'Karim B.', ...PLACE, ...NOVEMBER },
      REQUESTED_SEVENTY_TWO_HOURS_LATER,
    );

    expect(Either.isLeft(fresh)).toEqual(true);
    await sut.thenStoredRequestRowIs(old.right.id, {
      status: RentalRequestStatus.CONFIRMED,
      confirmedAt: CONFIRMED_AT,
    });
  });
});
