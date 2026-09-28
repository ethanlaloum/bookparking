import * as request from 'supertest';

import { createControllerTestApp } from '../../../../../shared/test/http/createControllerTestApp';
import { createNotificationControllerSUT } from './notification.controller.sut';

const MARC = 'account-marc';

describe('NotificationController', () => {
  let sut: ReturnType<typeof createNotificationControllerSUT>;
  let testApp: Awaited<ReturnType<typeof createControllerTestApp>>;

  const http = () => request(testApp.app.getHttpServer());

  beforeEach(async () => {
    sut = createNotificationControllerSUT();
    testApp = await createControllerTestApp(sut.metadata, sut.authState);
  });

  afterEach(async () => {
    await testApp.close();
  });

  it('lists the notifications of the signed-in account', async () => {
    sut.givenSignedInAs(MARC);
    sut.givenTheListIs({
      unreadCount: 1,
      items: [
        {
          id: '9b1f0c1e-0000-4000-8000-000000000001',
          kind: 'RENTAL_REQUEST_RECEIVED',
          audience: 'OWNER',
          createdAt: new Date('2026-10-01T07:05:00.000Z'),
          readAt: null,
          requestId: '45fed099-ae81-4a57-b24e-7005a96cd4a0',
          address: '12 rue Barla, 06300 Nice',
          box: '12',
          fromDay: '2026-10-10',
          toDay: '2026-10-12',
        },
      ],
    });

    const response = await http()
      .get('/notification')
      .set('Authorization', 'Bearer token');

    expect(response.status).toEqual(200);
    expect(response.body).toEqual({
      unreadCount: 1,
      items: [
        {
          id: '9b1f0c1e-0000-4000-8000-000000000001',
          kind: 'RENTAL_REQUEST_RECEIVED',
          audience: 'OWNER',
          createdAt: '2026-10-01T07:05:00.000Z',
          readAt: null,
          requestId: '45fed099-ae81-4a57-b24e-7005a96cd4a0',
          address: '12 rue Barla, 06300 Nice',
          box: '12',
          fromDay: '2026-10-10',
          toDay: '2026-10-12',
        },
      ],
    });
    sut.thenListWasReadFor(MARC);
  });

  it('answers 500 without the cause when the list cannot be read', async () => {
    sut.givenSignedInAs(MARC);
    sut.givenTheListFails();

    const response = await http()
      .get('/notification')
      .set('Authorization', 'Bearer token');

    expect(response.status).toEqual(500);
    expect(JSON.stringify(response.body)).not.toContain('10.0.0.12');
  });

  it('marks every notification of the signed-in account as read', async () => {
    sut.givenSignedInAs(MARC);
    sut.givenMarkingSucceeds();

    const response = await http()
      .post('/notification/read')
      .set('Authorization', 'Bearer token');

    expect(response.status).toEqual(204);
    sut.thenMarkedReadFor(MARC);
  });

  it('reads and marks nothing without a token', async () => {
    const list = await http().get('/notification');
    const read = await http().post('/notification/read');

    expect([list.status, read.status]).toEqual([401, 401]);
    sut.thenNothingWasRead();
  });

  describe('one notification', () => {
    const ACCEPTED = '9b1f0c1e-0000-4000-8000-000000000007';

    it('marks one notification of the signed-in account as read', async () => {
      sut.givenSignedInAs(MARC);

      const response = await http()
        .post(`/notification/${ACCEPTED}/read`)
        .set('Authorization', 'Bearer token');

      expect(response.status).toEqual(204);
      sut.thenOneMarkedReadFor(MARC, ACCEPTED);
    });

    it('answers a malformed identifier as it answers any other, and marks nothing', async () => {
      sut.givenSignedInAs(MARC);

      const response = await http()
        .post('/notification/pas-un-uuid/read')
        .set('Authorization', 'Bearer token');

      expect(response.status).toEqual(204);
      sut.thenNoneMarkedRead();
    });

    it('marks nothing without a token', async () => {
      const response = await http().post(`/notification/${ACCEPTED}/read`);

      expect(response.status).toEqual(401);
      sut.thenNoneMarkedRead();
    });
  });

  describe('phones', () => {
    const PHONE = 'ExponentPushToken[xG7wQ2mK9pL4vR1s]';

    it('registers the phone of the signed-in account', async () => {
      sut.givenSignedInAs(MARC);

      const response = await http()
        .post('/notification/push-device')
        .set('Authorization', 'Bearer token')
        .send({ token: PHONE });

      expect(response.status).toEqual(204);
      sut.thenPhoneWasRegistered(MARC, PHONE);
    });

    it('registers no phone without a token', async () => {
      const response = await http()
        .post('/notification/push-device')
        .send({ token: PHONE });

      expect(response.status).toEqual(401);
      sut.thenNoPhoneWasTouched();
    });

    it('refuses what is not an Expo push token, without repeating it', async () => {
      sut.givenSignedInAs(MARC);

      const responses: request.Response[] = [];
      for (const token of [
        '<script>alert(1)</script>',
        42,
        `ExponentPushToken[${'a'.repeat(300)}]`,
      ])
        responses.push(
          await http()
            .post('/notification/push-device')
            .set('Authorization', 'Bearer token')
            .send({ token }),
        );

      expect(responses.map((response) => response.status)).toEqual([
        400, 400, 400,
      ]);
      for (const response of responses) {
        expect(JSON.stringify(response.body)).not.toContain('script');
        expect(JSON.stringify(response.body)).not.toContain('aaaa');
      }
      sut.thenNoPhoneWasTouched();
    });

    it('forgets a phone without a session, since the app signs out first', async () => {
      const response = await http()
        .post('/notification/push-device/removal')
        .send({ token: PHONE });

      expect(response.status).toEqual(204);
      sut.thenPhoneWasForgotten(PHONE);
    });

    it('forgets nothing that is not an Expo push token', async () => {
      const response = await http()
        .post('/notification/push-device/removal')
        .send({ token: 'account-marc' });

      expect(response.status).toEqual(400);
      sut.thenNoPhoneWasTouched();
    });
  });
});
