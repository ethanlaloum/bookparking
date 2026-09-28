import { createConfirmRentalRequestSUT } from './ConfirmRentalRequest.sut';
import { RentalRequestExpiredError } from './errors/RentalRequestExpiredError';
import { PaymentUnavailableError } from '../../errors/PaymentUnavailableError';
import { RentalRequestNotFoundError } from '../../errors/RentalRequestNotFoundError';
import { RentalRequestPaymentFailedError } from './errors/RentalRequestPaymentFailedError';

const MARC_OWNER_ID = 'marc-owner-id';
const LEA_RENTER_ID = 'lea-renter-id';
const OTHER_OWNER_ID = 'other-owner-id';
const UNKNOWN_REQUEST_ID = 'a6c1d2e3-0000-4000-8000-000000000000';

describe('ConfirmRentalRequest', () => {
  it('confirms a pending request for the owner of the listing', async () => {
    const sut = createConfirmRentalRequestSUT();
    const requestId = await sut.givenPendingRequest({
      ownerId: MARC_OWNER_ID,
      renterId: LEA_RENTER_ID,
    });

    const result = await sut.whenConfirming({
      requestId,
      ownerId: MARC_OWNER_ID,
    });

    sut.thenResultIsRight(result);
    sut.thenRequestIsConfirmed(requestId);
    sut.thenConfirmationWasWrittenOnce(requestId);
  });

  it('refuses a request owned by someone else exactly as an unknown one', async () => {
    const sut = createConfirmRentalRequestSUT();
    const requestId = await sut.givenPendingRequest({
      ownerId: MARC_OWNER_ID,
      renterId: LEA_RENTER_ID,
    });

    const notOwned = await sut.whenConfirming({
      requestId,
      ownerId: OTHER_OWNER_ID,
    });
    const unknown = await sut.whenConfirming({
      requestId: UNKNOWN_REQUEST_ID,
      ownerId: OTHER_OWNER_ID,
    });

    sut.thenResultIsLeftWithError(notOwned, RentalRequestNotFoundError);
    sut.thenRefusalsAreIndistinguishable(notOwned, unknown);
    sut.thenNothingWasConfirmed();
  });

  it('confirms twice without a second write', async () => {
    const sut = createConfirmRentalRequestSUT();
    const requestId = await sut.givenPendingRequest({
      ownerId: MARC_OWNER_ID,
      renterId: LEA_RENTER_ID,
    });

    const first = await sut.whenConfirming({
      requestId,
      ownerId: MARC_OWNER_ID,
    });
    const second = await sut.whenConfirming({
      requestId,
      ownerId: MARC_OWNER_ID,
    });

    sut.thenResultIsRight(first);
    sut.thenResultIsRight(second);
    sut.thenConfirmationWasWrittenOnce(requestId);
  });

  it('refuses a request the renter tries to confirm for themselves', async () => {
    const sut = createConfirmRentalRequestSUT();
    const requestId = await sut.givenPendingRequest({
      ownerId: MARC_OWNER_ID,
      renterId: LEA_RENTER_ID,
    });

    const result = await sut.whenConfirming({
      requestId,
      ownerId: LEA_RENTER_ID,
    });

    sut.thenResultIsLeftWithError(result, RentalRequestNotFoundError);
    sut.thenNothingWasConfirmed();
  });
  it('refuses to confirm a request that has expired, and says so', async () => {
    const sut = createConfirmRentalRequestSUT();
    const requestId = await sut.givenPendingRequest({
      ownerId: MARC_OWNER_ID,
      renterId: LEA_RENTER_ID,
    });
    sut.givenRequestHasExpired(requestId);

    const result = await sut.whenConfirming({
      requestId,
      ownerId: MARC_OWNER_ID,
    });

    sut.thenResultIsLeftWithError(result, RentalRequestExpiredError);
    sut.thenNothingWasConfirmed();
  });
});

describe('ConfirmRentalRequest @SPEC-004', () => {
  const MARC = 'account-marc';
  const LEA = 'account-lea';
  const HOLD_PLACED_AT = '2026-10-01T07:05:00.000Z';
  const MARC_CONFIRMS_AT = '2026-10-02T16:00:00.000Z';

  it('refuses to confirm a request still awaiting payment @EX-004-06', async () => {
    const sut = createConfirmRentalRequestSUT();
    const requestId = await sut.givenRequestAwaitingPayment({
      ownerId: MARC,
      renterId: LEA,
    });

    const result = await sut.whenConfirmingAt({
      requestId,
      ownerId: MARC,
      confirmedAt: MARC_CONFIRMS_AT,
    });

    sut.thenResultIsLeftWithError(result, RentalRequestNotFoundError);
    sut.thenCapturesAre([]);
    sut.thenRequestStateIs(requestId, {
      status: 'AWAITING_PAYMENT',
      money: 'NONE',
    });
  });

  it('captures the hold when the owner confirms @EX-004-21', async () => {
    const sut = createConfirmRentalRequestSUT();
    const requestId = await sut.givenHoldPlaced({
      ownerId: MARC,
      renterId: LEA,
      paymentId: 'pi_lea',
      placedAt: HOLD_PLACED_AT,
    });

    const result = await sut.whenConfirmingAt({
      requestId,
      ownerId: MARC,
      confirmedAt: MARC_CONFIRMS_AT,
    });

    sut.thenResultIsRight(result);
    sut.thenCapturesAre([
      { paymentId: 'pi_lea', idempotencyKey: `capture-${requestId}` },
    ]);
    sut.thenRequestStateIs(requestId, {
      status: 'CONFIRMED',
      money: 'CAPTURED',
    });
    sut.thenConfirmedAtIs(requestId, MARC_CONFIRMS_AT);
  });

  it('captures once when the owner confirms twice @EX-004-22', async () => {
    const sut = createConfirmRentalRequestSUT();
    const requestId = await sut.givenHoldPlaced({
      ownerId: MARC,
      renterId: LEA,
      paymentId: 'pi_lea',
      placedAt: HOLD_PLACED_AT,
    });

    await sut.whenConfirmingAt({
      requestId,
      ownerId: MARC,
      confirmedAt: MARC_CONFIRMS_AT,
    });
    const second = await sut.whenConfirmingAt({
      requestId,
      ownerId: MARC,
      confirmedAt: '2026-10-02T16:01:00.000Z',
    });

    sut.thenResultIsRight(second);
    sut.thenCapturesAre([
      { paymentId: 'pi_lea', idempotencyKey: `capture-${requestId}` },
    ]);
  });

  it('fails the confirmation and changes nothing when Stripe does not answer @EX-004-23', async () => {
    const sut = createConfirmRentalRequestSUT();
    const requestId = await sut.givenHoldPlaced({
      ownerId: MARC,
      renterId: LEA,
      paymentId: 'pi_lea',
      placedAt: HOLD_PLACED_AT,
    });
    sut.givenStripeDoesNotAnswer();

    const result = await sut.whenConfirmingAt({
      requestId,
      ownerId: MARC,
      confirmedAt: MARC_CONFIRMS_AT,
    });

    sut.thenResultIsLeftWithError(result, PaymentUnavailableError);
    sut.thenRequestStateIs(requestId, {
      status: 'PENDING',
      money: 'AUTHORIZED',
    });
    sut.thenNothingWasConfirmed();
  });

  it('fails the confirmation and frees the dates when the bank declines the capture @EX-004-24', async () => {
    const sut = createConfirmRentalRequestSUT();
    const requestId = await sut.givenHoldPlaced({
      ownerId: MARC,
      renterId: LEA,
      paymentId: 'pi_lea',
      placedAt: HOLD_PLACED_AT,
    });
    sut.givenTheBankDeclinesTheCapture('pi_lea');

    const result = await sut.whenConfirmingAt({
      requestId,
      ownerId: MARC,
      confirmedAt: MARC_CONFIRMS_AT,
    });

    sut.thenResultIsLeftWithError(result, RentalRequestPaymentFailedError);
    sut.thenRequestStateIs(requestId, {
      status: 'PAYMENT_FAILED',
      money: 'RELEASE_DUE',
    });
    sut.thenNothingWasConfirmed();
  });
});

describe('ConfirmRentalRequest — notifications', () => {
  const MARC = 'account-marc';
  const LEA = 'account-lea';

  it('tells the renter her request was accepted', async () => {
    const sut = createConfirmRentalRequestSUT();
    const requestId = await sut.givenHoldPlaced({
      ownerId: MARC,
      renterId: LEA,
      paymentId: 'pi_lea',
      placedAt: '2026-10-01T07:05:00.000Z',
    });

    await sut.whenConfirmingAt({
      requestId,
      ownerId: MARC,
      confirmedAt: '2026-10-01T09:00:00.000Z',
    });

    sut.thenNotificationsAre([
      { kind: 'RENTAL_REQUEST_ACCEPTED', recipientId: LEA, requestId },
    ]);
    sut.thenNotificationsWereCreatedAt(['2026-10-01T09:00:00.000Z']);
  });

  it('tells the renter once when the owner confirms twice', async () => {
    const sut = createConfirmRentalRequestSUT();
    const requestId = await sut.givenPendingRequest({
      ownerId: MARC,
      renterId: LEA,
    });
    await sut.whenConfirming({ requestId, ownerId: MARC });

    await sut.whenConfirming({ requestId, ownerId: MARC });

    sut.thenNotificationsAre([
      { kind: 'RENTAL_REQUEST_ACCEPTED', recipientId: LEA, requestId },
    ]);
  });

  it('tells nobody when the request was already confirmed by a concurrent write', async () => {
    const sut = createConfirmRentalRequestSUT();
    const requestId = await sut.givenPendingRequest({
      ownerId: MARC,
      renterId: LEA,
    });
    sut.givenTheWriteFindsTheRequestNoLongerPending(requestId);

    await sut.whenConfirming({ requestId, ownerId: MARC });

    sut.thenNotificationsAre([]);
  });

  it('tells nobody when the confirmation is refused', async () => {
    const sut = createConfirmRentalRequestSUT();
    const expired = await sut.givenPendingRequest({
      ownerId: MARC,
      renterId: LEA,
    });
    sut.givenRequestHasExpired(expired);
    const unpaid = await sut.givenRequestAwaitingPayment({
      ownerId: MARC,
      renterId: LEA,
    });
    const notOwned = await sut.givenPendingRequest({
      ownerId: 'account-paul',
      renterId: LEA,
    });

    await sut.whenConfirming({ requestId: expired, ownerId: MARC });
    await sut.whenConfirming({ requestId: unpaid, ownerId: MARC });
    await sut.whenConfirming({ requestId: notOwned, ownerId: MARC });

    sut.thenNotificationsAre([]);
  });

  it('tells nobody when Stripe does not answer', async () => {
    const sut = createConfirmRentalRequestSUT();
    const requestId = await sut.givenHoldPlaced({
      ownerId: MARC,
      renterId: LEA,
      paymentId: 'pi_lea',
      placedAt: '2026-10-01T07:05:00.000Z',
    });
    sut.givenStripeDoesNotAnswer();

    await sut.whenConfirming({ requestId, ownerId: MARC });

    sut.thenNotificationsAre([]);
  });

  it('tells the renter her card was declined when the bank refuses the capture', async () => {
    const sut = createConfirmRentalRequestSUT();
    const requestId = await sut.givenHoldPlaced({
      ownerId: MARC,
      renterId: LEA,
      paymentId: 'pi_lea',
      placedAt: '2026-10-01T07:05:00.000Z',
    });
    sut.givenTheBankDeclinesTheCapture('pi_lea');

    await sut.whenConfirmingAt({
      requestId,
      ownerId: MARC,
      confirmedAt: '2026-10-01T09:00:00.000Z',
    });

    sut.thenNotificationsAre([
      { kind: 'RENTAL_PAYMENT_FAILED', recipientId: LEA, requestId },
    ]);
    sut.thenNotificationsWereCreatedAt(['2026-10-01T09:00:00.000Z']);
  });
});
