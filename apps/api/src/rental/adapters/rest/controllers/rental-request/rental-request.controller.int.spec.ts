import { Either } from 'effect/index';
import * as request from 'supertest';

import { createControllerTestApp } from '../../../../../shared/test/http/createControllerTestApp';
import { ArrivalNotYetPossibleError } from '../../../../domain/usecases/confirm-arrival/errors/ArrivalNotYetPossibleError';
import { InvalidIssueMessageError } from '../../../../domain/errors/InvalidIssueMessageError';
import { RentalRequestNotFoundError } from '../../../../domain/errors/RentalRequestNotFoundError';
import { RentalIssueNotAnswerableError } from '../../../../domain/usecases/answer-rental-issue/errors/RentalIssueNotAnswerableError';
import { RentalIssueNotReportableError } from '../../../../domain/usecases/report-rental-issue/errors/RentalIssueNotReportableError';
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

    it('answers 422 with the reason when the place is not open on the requested days', async () => {
      sut = createRentalRequestControllerSUT({ user: { id: LEA_ACCOUNT_ID } });
      testApp = await createControllerTestApp(sut.metadata, sut.authState);
      sut.givenRentalRequestRefusedBecauseClosed();

      const response = await http()
        .post('/rental-request')
        .set('Authorization', 'Bearer token-of-lea')
        .set('Idempotency-Key', AN_INTENT)
        .send(RENTAL_REQUEST_BODY);

      expect(response.status).toEqual(422);
      expect(response.body.message).toEqual(
        "La place n'est pas ouverte sur toute la période demandée",
      );
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

  describe('GET /rental-request', () => {
    it('hands the renter her access instructions and the owner deadline as the use case presents them', async () => {
      sut = createRentalRequestControllerSUT({ user: { id: LEA_ACCOUNT_ID } });
      sut.listRenterRentalRequests.willResolve(
        Either.right([
          {
            id: A_REQUEST_ID,
            listingId: '3f1a9c0e-9c1e-4c5e-8a2b-1f2d3e4a5b6c',
            address: '12 rue Barla, 06300 Nice',
            box: '12',
            ownerId: MARC_ACCOUNT_ID,
            renterId: LEA_ACCOUNT_ID,
            fromDay: '2026-10-10',
            toDay: '2026-10-12',
            priceInCents: 4500,
            status: 'CONFIRMED',
            money: 'CAPTURED',
            requestedAt: new Date('2026-10-01T07:00:00.000Z'),
            confirmedAt: new Date('2026-10-01T09:00:00.000Z'),
            startsAt: new Date('2026-10-09T22:00:00.000Z'),
            freeCancellationUntil: new Date('2026-10-08T22:00:00.000Z'),
            accessInstructions: 'Portail 4821B, deuxième sous-sol.',
            answerBy: null,
            ownerShareInCents: null,
            arrivedAt: null,
            issue: {
              id: 'issue-1',
              requestId: A_REQUEST_ID,
              reason: 'NO_ACCESS',
              message: null,
              reportedAt: new Date('2026-10-10T08:00:00.000Z'),
              status: 'OPEN',
              ownerReply: 'Le code du portail est 4821B.',
              ownerRepliedAt: new Date('2026-10-10T08:10:00.000Z'),
              refundInCents: null,
              resolvedAt: null,
            },
            issueReportable: false,
          },
        ]),
      );
      testApp = await createControllerTestApp(sut.metadata, sut.authState);

      const response = await http()
        .get('/rental-request')
        .set('Authorization', 'Bearer token');

      expect(response.status).toEqual(200);
      expect(response.body[0]).toMatchObject({
        accessInstructions: 'Portail 4821B, deuxième sous-sol.',
        answerBy: null,
        issueReportable: false,
      });
      expect(response.body[0].issue).toEqual({
        reason: 'NO_ACCESS',
        message: null,
        reportedAt: '2026-10-10T08:00:00.000Z',
        status: 'OPEN',
        ownerReply: 'Le code du portail est 4821B.',
        ownerRepliedAt: '2026-10-10T08:10:00.000Z',
        refundInCents: null,
        resolvedAt: null,
      });
      expect(response.body[0]).not.toHaveProperty('ownerId');
      expect(sut.listRenterRentalRequests.lastCall?.renterId).toEqual(
        LEA_ACCOUNT_ID,
      );
    });
  });

  describe('POST /rental-request/:id/arrival', () => {
    it('records the arrival of the signed-in renter', async () => {
      sut = createRentalRequestControllerSUT({ user: { id: LEA_ACCOUNT_ID } });
      sut.confirmArrival.willResolve(Either.right(undefined));
      testApp = await createControllerTestApp(sut.metadata, sut.authState);

      const response = await http()
        .post(`/rental-request/${A_REQUEST_ID}/arrival`)
        .set('Authorization', 'Bearer token');

      expect(response.status).toEqual(204);
      expect(sut.confirmArrival.lastCall).toMatchObject({
        requestId: A_REQUEST_ID,
        renterId: LEA_ACCOUNT_ID,
      });
    });

    it('answers 409 before the rental starts', async () => {
      sut = createRentalRequestControllerSUT({ user: { id: LEA_ACCOUNT_ID } });
      sut.confirmArrival.willResolve(
        Either.left(new ArrivalNotYetPossibleError()),
      );
      testApp = await createControllerTestApp(sut.metadata, sut.authState);

      const response = await http()
        .post(`/rental-request/${A_REQUEST_ID}/arrival`)
        .set('Authorization', 'Bearer token');

      expect(response.status).toEqual(409);
    });

    it('answers a malformed identifier as an unknown request, without asking the use case', async () => {
      sut = createRentalRequestControllerSUT({ user: { id: LEA_ACCOUNT_ID } });
      testApp = await createControllerTestApp(sut.metadata, sut.authState);

      const response = await http()
        .post('/rental-request/pas-un-uuid/arrival')
        .set('Authorization', 'Bearer token');

      expect(response.status).toEqual(404);
      expect(sut.confirmArrival.calls).toHaveLength(0);
    });
  });

  describe('POST /rental-request/:id/issue', () => {
    it('records the report of the signed-in driver and answers 201', async () => {
      sut = createRentalRequestControllerSUT({ user: { id: LEA_ACCOUNT_ID } });
      sut.reportRentalIssue.willResolve(Either.right(undefined));
      testApp = await createControllerTestApp(sut.metadata, sut.authState);

      const response = await http()
        .post(`/rental-request/${A_REQUEST_ID}/issue`)
        .set('Authorization', 'Bearer token')
        .send({ reason: 'PLACE_OCCUPIED', message: 'Une voiture est garée' });

      expect(response.status).toEqual(201);
      expect(
        sut.reportRentalIssue.calls.map(({ reportedAt: _at, ...call }) => call),
      ).toEqual([
        {
          requestId: A_REQUEST_ID,
          renterId: LEA_ACCOUNT_ID,
          reason: 'PLACE_OCCUPIED',
          message: 'Une voiture est garée',
        },
      ]);
    });

    it('answers 400 on an unknown reason, without calling the use case', async () => {
      sut = createRentalRequestControllerSUT({ user: { id: LEA_ACCOUNT_ID } });
      testApp = await createControllerTestApp(sut.metadata, sut.authState);

      const response = await http()
        .post(`/rental-request/${A_REQUEST_ID}/issue`)
        .set('Authorization', 'Bearer token')
        .send({ reason: 'TOO_EXPENSIVE' });

      expect(response.status).toEqual(400);
      expect(sut.reportRentalIssue.calls).toHaveLength(0);
    });

    it.each([
      [
        new RentalIssueNotReportableError('NOT_STARTED'),
        409,
        'Vous pourrez signaler un problème à partir du début de la location',
      ],
      [
        new InvalidIssueMessageError('required'),
        400,
        'Décrivez le problème en quelques mots, 10 caractères au moins',
      ],
      [
        new RentalRequestNotFoundError(),
        404,
        "Cette demande de location n'existe pas",
      ],
    ])('turns %s into %s', async (error, status, message) => {
      sut = createRentalRequestControllerSUT({ user: { id: LEA_ACCOUNT_ID } });
      sut.reportRentalIssue.willResolve(Either.left(error));
      testApp = await createControllerTestApp(sut.metadata, sut.authState);

      const response = await http()
        .post(`/rental-request/${A_REQUEST_ID}/issue`)
        .set('Authorization', 'Bearer token')
        .send({ reason: 'OTHER', message: 'court' });

      expect({
        status: response.status,
        message: response.body.message,
      }).toEqual({ status, message });
    });
  });

  describe('POST /rental-request/:id/issue/answer', () => {
    it('records the answer of the signed-in owner', async () => {
      sut = createRentalRequestControllerSUT({ user: { id: MARC_ACCOUNT_ID } });
      sut.answerRentalIssue.willResolve(Either.right(undefined));
      testApp = await createControllerTestApp(sut.metadata, sut.authState);

      const response = await http()
        .post(`/rental-request/${A_REQUEST_ID}/issue/answer`)
        .set('Authorization', 'Bearer token')
        .send({ reply: 'Le code du portail est 4821B.' });

      expect(response.status).toEqual(204);
      expect(
        sut.answerRentalIssue.calls.map(({ answeredAt: _at, ...call }) => call),
      ).toEqual([
        {
          requestId: A_REQUEST_ID,
          ownerId: MARC_ACCOUNT_ID,
          reply: 'Le code du portail est 4821B.',
        },
      ]);
    });

    it('answers 409 when no open report awaits an answer', async () => {
      sut = createRentalRequestControllerSUT({ user: { id: MARC_ACCOUNT_ID } });
      sut.answerRentalIssue.willResolve(
        Either.left(new RentalIssueNotAnswerableError()),
      );
      testApp = await createControllerTestApp(sut.metadata, sut.authState);

      const response = await http()
        .post(`/rental-request/${A_REQUEST_ID}/issue/answer`)
        .set('Authorization', 'Bearer token')
        .send({ reply: 'Le code du portail est 4821B.' });

      expect(response.status).toEqual(409);
    });
  });
});
