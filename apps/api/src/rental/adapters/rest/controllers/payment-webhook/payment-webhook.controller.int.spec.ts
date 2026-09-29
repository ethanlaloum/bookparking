import * as request from 'supertest';

import { createControllerTestApp } from '../../../../../shared/test/http/createControllerTestApp';
import { createPaymentWebhookControllerSUT } from './payment-webhook.controller.sut';

describe('PaymentWebhookController @SPEC-004', () => {
  let testApp: Awaited<ReturnType<typeof createControllerTestApp>>;

  afterEach(async () => {
    await testApp.close();
  });

  it('answers 400 to an event signed with another secret and changes nothing @EX-004-11', async () => {
    const sut = createPaymentWebhookControllerSUT();
    testApp = await createControllerTestApp(sut.metadata);
    const { payload, signature } = sut.leaHoldSignedWithAnotherSecret();

    const response = await request(testApp.app.getHttpServer())
      .post('/payment/stripe-webhook')
      .set('Content-Type', 'application/json')
      .set('Stripe-Signature', signature)
      .send(payload);

    expect(response.status).toEqual(400);
    sut.thenNothingWasRecorded();
  });

  it('acknowledges with 200 a well-signed event no request carries @EX-004-13', async () => {
    const sut = createPaymentWebhookControllerSUT();
    testApp = await createControllerTestApp(sut.metadata);
    const { payload, signature } = sut.holdForNobodySignedByStripe();

    const response = await request(testApp.app.getHttpServer())
      .post('/payment/stripe-webhook')
      .set('Content-Type', 'application/json')
      .set('Stripe-Signature', signature)
      .send(payload);

    expect(response.status).toEqual(200);
    sut.thenRecordedExactly({
      kind: 'HOLD_PLACED',
      requestId: sut.nobodyRequestId,
      paymentId: 'pi_lea',
      placedAt: new Date(1790838300 * 1000),
      receivedAt: expect.any(Date),
    });
  });
});
