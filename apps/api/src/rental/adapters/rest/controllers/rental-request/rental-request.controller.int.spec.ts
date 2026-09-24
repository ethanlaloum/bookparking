import * as request from 'supertest';

import { createControllerTestApp } from '../../../../../shared/test/http/createControllerTestApp';
import {
  A_CHECKOUT_URL,
  A_REQUEST_ID,
  createRentalRequestControllerSUT,
  LEA_ACCOUNT_ID,
  MARC_ACCOUNT_ID,
} from './rental-request.controller.sut';

const AN_INTENT = '9d3c1b2a-0f4e-4a5b-8c6d-7e8f9a0b1c2d';

const RENTAL_REQUEST_BODY = {
  address: '12 rue Barla, 06300 Nice',
  box: '12',
  fromDay: '2026-10-01',
  toDay: '2026-10-03',
};

describe('RentalRequestController @SPEC-002', () => {
  let sut: ReturnType<typeof createRentalRequestControllerSUT>;
  let testApp: Awaited<ReturnType<typeof createControllerTestApp>>;

  const http = () => request(testApp.app.getHttpServer());

  afterEach(async () => {
    await testApp.close();
  });

  describe('POST /rental-request', () => {
    it('refuses a rental request from a visitor with no account @EX-002-12', async () => {
      sut = createRentalRequestControllerSUT({ user: null });
      testApp = await createControllerTestApp(sut.metadata, sut.authState);

      const response = await http()
        .post('/rental-request')
        .send(RENTAL_REQUEST_BODY);

      expect(response.status).toEqual(401);
      sut.thenNoRentalRequestWasMade();
    });

    it('records the rental request for the authenticated account whatever the body names @EX-002-13', async () => {
      sut = createRentalRequestControllerSUT({ user: { id: LEA_ACCOUNT_ID } });
      testApp = await createControllerTestApp(sut.metadata, sut.authState);
      sut.givenRentalRequestSucceeds();

      const response = await http()
        .post('/rental-request')
        .set('Authorization', 'Bearer token-of-lea')
        .set('Idempotency-Key', AN_INTENT)
        .send({ ...RENTAL_REQUEST_BODY, renterId: MARC_ACCOUNT_ID });

      expect(response.status).toEqual(201);
      sut.thenRentalRequestWasMadeFor(LEA_ACCOUNT_ID);
      sut.thenBodyRenterIdWasIgnored(MARC_ACCOUNT_ID);
    });
  });
  describe('POST /rental-request/:id/confirmation', () => {
    it('refuses a confirmation from a visitor with no account', async () => {
      sut = createRentalRequestControllerSUT({ user: null });
      testApp = await createControllerTestApp(sut.metadata, sut.authState);

      const response = await http().post(
        `/rental-request/${A_REQUEST_ID}/confirmation`,
      );

      expect(response.status).toEqual(401);
      sut.thenNoConfirmationWasAttempted();
    });

    it('confirms for the authenticated account and answers without a body', async () => {
      sut = createRentalRequestControllerSUT({ user: { id: MARC_ACCOUNT_ID } });
      testApp = await createControllerTestApp(sut.metadata, sut.authState);
      sut.givenConfirmationSucceeds();

      const response = await http()
        .post(`/rental-request/${A_REQUEST_ID}/confirmation`)
        .set('Authorization', 'Bearer token-of-marc');

      expect(response.status).toEqual(204);
      expect(response.body).toEqual({});
      sut.thenConfirmationWasAttemptedBy(MARC_ACCOUNT_ID);
    });

    it('answers 404 for a request this account does not own', async () => {
      sut = createRentalRequestControllerSUT({ user: { id: LEA_ACCOUNT_ID } });
      testApp = await createControllerTestApp(sut.metadata, sut.authState);
      sut.givenRequestIsUnknownToThisAccount();

      const response = await http()
        .post(`/rental-request/${A_REQUEST_ID}/confirmation`)
        .set('Authorization', 'Bearer token-of-lea');

      expect(response.status).toEqual(404);
      expect(JSON.stringify(response.body)).not.toContain(A_REQUEST_ID);
    });

    it('answers 409 for a request that has expired', async () => {
      sut = createRentalRequestControllerSUT({ user: { id: MARC_ACCOUNT_ID } });
      testApp = await createControllerTestApp(sut.metadata, sut.authState);
      sut.givenRequestHasExpired();

      const response = await http()
        .post(`/rental-request/${A_REQUEST_ID}/confirmation`)
        .set('Authorization', 'Bearer token-of-marc');

      expect(response.status).toEqual(409);
      sut.thenConfirmationWasAttemptedBy(MARC_ACCOUNT_ID);
    });

    it('answers 404 for a malformed identifier, never 500', async () => {
      sut = createRentalRequestControllerSUT({ user: { id: MARC_ACCOUNT_ID } });
      testApp = await createControllerTestApp(sut.metadata, sut.authState);

      const response = await http()
        .post('/rental-request/pas-un-identifiant/confirmation')
        .set('Authorization', 'Bearer token-of-marc');

      expect(response.status).toEqual(404);
      sut.thenNoConfirmationWasAttempted();
    });
  });
});

describe('RentalRequestController @SPEC-004', () => {
  let sut: ReturnType<typeof createRentalRequestControllerSUT>;
  let testApp: Awaited<ReturnType<typeof createControllerTestApp>>;

  const http = () => request(testApp.app.getHttpServer());

  afterEach(async () => {
    await testApp.close();
  });

  it('never passes a price sent in the body to the use-case @EX-004-02', async () => {
    sut = createRentalRequestControllerSUT({ user: { id: LEA_ACCOUNT_ID } });
    testApp = await createControllerTestApp(sut.metadata, sut.authState);
    sut.givenRentalRequestSucceeds();

    const response = await http()
      .post('/rental-request')
      .set('Authorization', 'Bearer token-of-lea')
      .set('Idempotency-Key', AN_INTENT)
      .send({ ...RENTAL_REQUEST_BODY, priceInCents: 1 });

    expect(response.status).toEqual(201);
    sut.thenTheUseCaseReceivedOnly({
      renterId: LEA_ACCOUNT_ID,
      address: RENTAL_REQUEST_BODY.address,
      box: RENTAL_REQUEST_BODY.box,
      fromDay: RENTAL_REQUEST_BODY.fromDay,
      toDay: RENTAL_REQUEST_BODY.toDay,
      requestedAt: expect.any(Date),
      idempotencyKey: AN_INTENT,
    });
  });

  it('answers 201 with the request id and the payment page address @EX-004-04', async () => {
    sut = createRentalRequestControllerSUT({ user: { id: LEA_ACCOUNT_ID } });
    testApp = await createControllerTestApp(sut.metadata, sut.authState);
    const { requestId } = sut.givenRentalRequestSucceeds();

    const response = await http()
      .post('/rental-request')
      .set('Authorization', 'Bearer token-of-lea')
      .set('Idempotency-Key', AN_INTENT)
      .send(RENTAL_REQUEST_BODY);

    expect(response.status).toEqual(201);
    expect(response.body).toEqual({
      id: requestId,
      checkoutUrl: A_CHECKOUT_URL,
    });
  });

  it('refuses a request that carries no intent identifier, or a malformed one @EX-004-47', async () => {
    sut = createRentalRequestControllerSUT({ user: { id: LEA_ACCOUNT_ID } });
    testApp = await createControllerTestApp(sut.metadata, sut.authState);
    sut.givenRentalRequestSucceeds();

    const without = await http()
      .post('/rental-request')
      .set('Authorization', 'Bearer token-of-lea')
      .send(RENTAL_REQUEST_BODY);
    const malformed = await http()
      .post('/rental-request')
      .set('Authorization', 'Bearer token-of-lea')
      .set('Idempotency-Key', 'clic-1')
      .send(RENTAL_REQUEST_BODY);

    expect(without.status).toEqual(400);
    expect(malformed.status).toEqual(400);
    sut.thenNoRentalRequestWasMade();
  });
});

describe('RentalRequestController @SPEC-005', () => {
  let sut: ReturnType<typeof createRentalRequestControllerSUT>;
  let testApp: Awaited<ReturnType<typeof createControllerTestApp>>;

  const http = () => request(testApp.app.getHttpServer());

  afterEach(async () => {
    await testApp.close();
  });

  it('answers the effect on the money, 404 for a malformed id, 409 once started @EX-005-17', async () => {
    sut = createRentalRequestControllerSUT({ user: { id: LEA_ACCOUNT_ID } });
    testApp = await createControllerTestApp(sut.metadata, sut.authState);
    sut.givenTheCancellationRefunds();

    const cancelled = await http()
      .post(`/rental-request/${A_REQUEST_ID}/cancellation`)
      .set('Authorization', 'Bearer token-of-lea');
    const malformed = await http()
      .post('/rental-request/pas-un-uuid/cancellation')
      .set('Authorization', 'Bearer token-of-lea');

    expect(cancelled.status).toEqual(200);
    expect(cancelled.body).toEqual({ outcome: 'REFUNDED' });
    expect(malformed.status).toEqual(404);
    sut.thenTheCancellationWasAskedBy(LEA_ACCOUNT_ID, A_REQUEST_ID);

    sut.givenTheRentalHasStarted();
    const started = await http()
      .post(`/rental-request/${A_REQUEST_ID}/cancellation`)
      .set('Authorization', 'Bearer token-of-lea');
    expect(started.status).toEqual(409);
  });
});
