import { Either } from 'effect/index';

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

  it('refunds the part Bookparking granted on a reported problem, once, replaying the same key after an outage', async () => {
    const sut = createSweepRentalRequestsSUT();
    sut.givenPartialRefundDecided('request-lea', 1500);
    sut.givenStripeDoesNotAnswer();

    const duringTheOutage = await sut.whenSweepingAt(
      '2026-10-10T10:05:00.000Z',
    );
    sut.thenIssueRefundIdIs(null);

    sut.givenStripeAnswersAgain();
    await sut.whenSweepingAt('2026-10-10T10:10:00.000Z');
    await sut.whenSweepingAt('2026-10-10T10:15:00.000Z');

    expect(duringTheOutage).toEqual(
      Either.right({ abandoned: 0, expired: 0, settled: 0, stillOwed: 1 }),
    );
    sut.thenIssueRefundsAre([
      {
        paymentId: 'pi_lea',
        idempotencyKey: 'issue-refund-request-lea',
        amountInCents: 1500,
      },
    ]);
    sut.thenIssueRefundIdIs('re_pi_lea');
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

describe('SweepRentalRequests — notifications', () => {
  it('tells the renter her request expired and the owner he let it lapse', async () => {
    const sut = createSweepRentalRequestsSUT();
    const requestId = await sut.givenHoldPlacedAt('2026-10-01T07:05:00.000Z');

    const result = await sut.whenSweepingAt('2026-10-03T07:05:00.000Z');

    sut.thenReportIs(result, {
      abandoned: 0,
      expired: 1,
      settled: 1,
      stillOwed: 0,
    });
    sut.thenNotificationsAre([
      { kind: 'RENTAL_REQUEST_EXPIRED', recipientId: 'account-lea', requestId },
      {
        kind: 'RENTAL_REQUEST_UNANSWERED',
        recipientId: 'account-marc',
        requestId,
      },
    ]);
    sut.thenNotificationsWereCreatedAt([
      '2026-10-03T07:05:00.000Z',
      '2026-10-03T07:05:00.000Z',
    ]);
  });

  it('tells once when two sweeps pass over the same lapsed request', async () => {
    const sut = createSweepRentalRequestsSUT();
    await sut.givenHoldPlacedAt('2026-10-01T07:05:00.000Z');
    await sut.whenSweepingAt('2026-10-03T07:05:00.000Z');

    await sut.whenSweepingAt('2026-10-03T07:10:00.000Z');

    sut.thenNotificationsWereCreatedAt([
      '2026-10-03T07:05:00.000Z',
      '2026-10-03T07:05:00.000Z',
    ]);
  });

  it('tells nobody about a request still within its delay, nor about an unpaid one it abandons', async () => {
    const sut = createSweepRentalRequestsSUT();
    await sut.givenHoldPlacedAt('2026-10-01T07:05:00.000Z');
    await sut.givenLeaRequestAwaitingPaymentSince('2026-10-01T07:00:00.000Z');

    await sut.whenSweepingAt('2026-10-03T07:04:00.000Z');

    sut.thenNotificationsAre([]);
  });
});
