import { createRecordPaymentEventSUT } from './RecordPaymentEvent.sut';

describe('RecordPaymentEvent @SPEC-004', () => {
  it('hands the request to the owner once Stripe reports the hold @EX-004-10', async () => {
    const sut = createRecordPaymentEventSUT();
    const requestId = await sut.givenLeaRequestAwaitingPayment();

    const result = await sut.whenStripeReportsTheHold({
      requestId,
      paymentId: 'pi_lea',
      at: '2026-10-01T07:05:00.000Z',
    });

    sut.thenResultIsRight(result);
    sut.thenRequestStateIs(requestId, {
      status: 'PENDING',
      money: 'AUTHORIZED',
    });
    sut.thenHoldPlacedAt(requestId, '2026-10-01T07:05:00.000Z');
    await sut.thenTheOwnerSees([requestId]);
  });

  it('counts a hold reported twice only once @EX-004-12', async () => {
    const sut = createRecordPaymentEventSUT();
    const requestId = await sut.givenLeaRequestAwaitingPayment();
    await sut.whenStripeReportsTheHold({
      requestId,
      paymentId: 'pi_lea',
      at: '2026-10-01T07:05:00.000Z',
    });

    const replay = await sut.whenStripeReportsTheHold({
      requestId,
      paymentId: 'pi_lea',
      at: '2026-10-01T07:40:00.000Z',
    });

    sut.thenResultIsRight(replay);
    sut.thenRequestStateIs(requestId, {
      status: 'PENDING',
      money: 'AUTHORIZED',
    });
    sut.thenHoldPlacedAt(requestId, '2026-10-01T07:05:00.000Z');
  });

  it('abandons the request when its payment page expires @EX-004-15', async () => {
    const sut = createRecordPaymentEventSUT();
    const requestId = await sut.givenLeaRequestAwaitingPayment();

    const result = await sut.whenStripeReportsThePagePastItsLife(requestId);

    sut.thenResultIsRight(result);
    sut.thenRequestStateIs(requestId, { status: 'ABANDONED', money: 'NONE' });
  });

  it('releases a hold that arrives after the request was abandoned @EX-004-19', async () => {
    const sut = createRecordPaymentEventSUT();
    const requestId = await sut.givenLeaRequestAwaitingPayment();
    await sut.givenRequestAbandoned(requestId);

    const result = await sut.whenStripeReportsTheHold({
      requestId,
      paymentId: 'pi_lea',
      at: '2026-10-01T09:03:00.000Z',
    });

    sut.thenResultIsRight(result);
    sut.thenReleasesAre([
      { paymentId: 'pi_lea', idempotencyKey: `release-${requestId}` },
    ]);
    sut.thenRequestStateIs(requestId, {
      status: 'ABANDONED',
      money: 'RELEASED',
    });
    await sut.thenTheOwnerSees([]);
  });
});
