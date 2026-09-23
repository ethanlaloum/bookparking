import { createSweepRentalRequestsSUT } from './SweepRentalRequests.sut';

describe('SweepRentalRequests @SPEC-004', () => {
  it('counts the owner forty-eight hours from the hold, not from the request @EX-004-14', async () => {
    const sut = createSweepRentalRequestsSUT();
    const requestId = await sut.givenHoldPlacedAt(
      '2026-10-01T07:25:00.000Z',
      '2026-10-01T07:00:00.000Z',
    );

    await sut.whenSweepingAt('2026-10-03T07:10:00.000Z');

    sut.thenRequestStateIs(requestId, {
      status: 'PENDING',
      money: 'AUTHORIZED',
    });
    sut.thenReleasesAre([]);
  });

  it('abandons a request left without news from Stripe for two hours @EX-004-18', async () => {
    const sut = createSweepRentalRequestsSUT();
    const requestId = await sut.givenLeaRequestAwaitingPaymentSince(
      '2026-10-01T07:00:00.000Z',
    );

    await sut.whenSweepingAt('2026-10-01T08:59:00.000Z');
    sut.thenStatusIs(requestId, 'AWAITING_PAYMENT');

    await sut.whenSweepingAt('2026-10-01T09:00:00.000Z');
    sut.thenStatusIs(requestId, 'ABANDONED');
  });

  it('records as confirmed a capture the database missed @EX-004-25', async () => {
    const sut = createSweepRentalRequestsSUT();
    const requestId = await sut.givenHoldPlacedAt('2026-10-01T07:05:00.000Z');
    sut.givenStripeCapturedWithoutTheDatabaseKnowing();

    await sut.whenSweepingAt('2026-10-03T07:05:00.000Z');

    sut.thenRequestStateIs(requestId, {
      status: 'CONFIRMED',
      money: 'CAPTURED',
    });
    sut.thenRefundsAre([]);
  });

  it('expires the request and releases the hold forty-eight hours after it @EX-004-26', async () => {
    const sut = createSweepRentalRequestsSUT();
    const requestId = await sut.givenHoldPlacedAt('2026-10-01T07:05:00.000Z');

    const result = await sut.whenSweepingAt('2026-10-03T07:05:00.000Z');

    sut.thenResultIsRight(result);
    sut.thenRequestStateIs(requestId, { status: 'EXPIRED', money: 'RELEASED' });
    sut.thenReleasesAre([requestId]);
  });

  it('leaves the request alone one minute before @EX-004-27', async () => {
    const sut = createSweepRentalRequestsSUT();
    const requestId = await sut.givenHoldPlacedAt('2026-10-01T07:05:00.000Z');

    await sut.whenSweepingAt('2026-10-03T07:04:00.000Z');

    sut.thenRequestStateIs(requestId, {
      status: 'PENDING',
      money: 'AUTHORIZED',
    });
    sut.thenReleasesAre([]);
  });

  it('never expires a confirmed request @EX-004-28', async () => {
    const sut = createSweepRentalRequestsSUT();
    const requestId = await sut.givenHoldPlacedAt('2026-10-01T07:05:00.000Z');
    await sut.givenConfirmedAt(requestId, '2026-10-02T16:00:00.000Z');

    await sut.whenSweepingAt('2026-10-05T07:05:00.000Z');

    sut.thenRequestStateIs(requestId, {
      status: 'CONFIRMED',
      money: 'CAPTURED',
    });
    sut.thenReleasesAre([]);
    sut.thenRefundsAre([]);
  });

  it('keeps a release owed when Stripe does not answer, and settles it on the next sweep @EX-004-33', async () => {
    const sut = createSweepRentalRequestsSUT();
    const requestId = await sut.givenHoldPlacedAt('2026-10-01T07:05:00.000Z');
    sut.givenStripeDoesNotAnswer();

    const duringTheOutage = await sut.whenSweepingAt(
      '2026-10-03T07:05:00.000Z',
    );
    sut.thenResultIsRight(duringTheOutage);
    sut.thenRequestStateIs(requestId, {
      status: 'EXPIRED',
      money: 'RELEASE_DUE',
    });

    sut.givenStripeAnswersAgain();
    await sut.whenSweepingAt('2026-10-03T07:10:00.000Z');
    sut.thenRequestStateIs(requestId, { status: 'EXPIRED', money: 'RELEASED' });
  });

  it('sends the same idempotency key on every attempt @EX-004-34', async () => {
    const sut = createSweepRentalRequestsSUT();
    const requestId = await sut.givenHoldPlacedAt('2026-10-01T07:05:00.000Z');
    sut.givenStripeDoesNotAnswer();
    await sut.whenSweepingAt('2026-10-03T07:05:00.000Z');

    sut.givenStripeAnswersAgain();
    await sut.whenSweepingAt('2026-10-03T07:10:00.000Z');

    sut.thenReleaseAttemptKeysAre([
      `release-${requestId}`,
      `release-${requestId}`,
    ]);
  });

  it('never returns money twice @EX-004-36', async () => {
    const sut = createSweepRentalRequestsSUT();
    const requestId = await sut.givenHoldPlacedAt('2026-10-01T07:05:00.000Z');
    await sut.givenConfirmedAt(requestId, '2026-10-02T16:00:00.000Z');
    sut.givenCancelledByTheOperator(requestId, 'REFUNDED');

    await sut.whenSweepingAt('2026-10-03T07:10:00.000Z');

    sut.thenStripeWasAskedNothing();
  });

  it('refunds, and never confirms, a cancelled request whose capture the database missed @EX-004-41', async () => {
    const sut = createSweepRentalRequestsSUT();
    const requestId = await sut.givenHoldPlacedAt('2026-10-01T07:05:00.000Z');
    sut.givenStripeCapturedWithoutTheDatabaseKnowing();
    sut.givenCancelledByTheOperator(requestId, 'RELEASE_DUE');

    await sut.whenSweepingAt('2026-10-02T09:00:00.000Z');

    sut.thenRequestStateIs(requestId, {
      status: 'CANCELLED',
      money: 'REFUNDED',
    });
    sut.thenRefundsAre([requestId]);
  });
});
