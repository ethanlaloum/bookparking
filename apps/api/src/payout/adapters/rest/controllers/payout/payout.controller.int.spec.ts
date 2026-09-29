import { Either } from 'effect/index';
import * as request from 'supertest';

import { createControllerTestApp } from '../../../../../shared/test/http/createControllerTestApp';
import { PayoutAccountNotReadyError } from '../../../../domain/errors/PayoutAccountNotReadyError';
import { PayoutUnavailableError } from '../../../../domain/errors/PayoutUnavailableError';
import { createPayoutControllerSUT } from './payout.controller.sut';

const MARC = 'account-marc';

describe('PayoutController', () => {
  let sut: ReturnType<typeof createPayoutControllerSUT>;
  let testApp: Awaited<ReturnType<typeof createControllerTestApp>>;

  const http = () => request(testApp.app.getHttpServer());

  beforeEach(async () => {
    sut = createPayoutControllerSUT();
    testApp = await createControllerTestApp(sut.metadata, sut.authState);
  });

  afterEach(async () => {
    await testApp.close();
  });

  it('reads the payouts of the signed-in owner', async () => {
    sut.givenSignedInAs(MARC);
    sut.readPayouts.willResolve(
      Either.right({
        accountStatus: 'READY',
        feePercent: 15,
        releaseDelayHours: 24,
        upcomingInCents: 3825,
        sentInCents: 0,
        payouts: [
          {
            requestId: '45fed099-ae81-4a57-b24e-7005a96cd4a0',
            address: '12 rue Barla, 06300 Nice',
            box: 'B12',
            fromDay: '2026-10-10',
            toDay: '2026-10-12',
            priceInCents: 4500,
            amountInCents: 3825,
            status: 'HELD',
            releaseAt: new Date('2026-10-10T22:00:00.000Z'),
            transferredAt: null,
          },
        ],
      }),
    );

    const response = await http()
      .get('/payout')
      .set('Authorization', 'Bearer token');

    expect(response.status).toEqual(200);
    expect(response.body).toEqual({
      accountStatus: 'READY',
      feePercent: 15,
      releaseDelayHours: 24,
      upcomingInCents: 3825,
      sentInCents: 0,
      payouts: [
        {
          requestId: '45fed099-ae81-4a57-b24e-7005a96cd4a0',
          address: '12 rue Barla, 06300 Nice',
          box: 'B12',
          fromDay: '2026-10-10',
          toDay: '2026-10-12',
          priceInCents: 4500,
          amountInCents: 3825,
          status: 'HELD',
          releaseAt: '2026-10-10T22:00:00.000Z',
          transferredAt: null,
        },
      ],
    });
    expect(sut.readPayouts.lastCall?.accountId).toEqual(MARC);
  });

  it('hands the Stripe onboarding link of the signed-in owner', async () => {
    sut.givenSignedInAs(MARC);
    sut.startOnboarding.willResolve(
      Either.right('https://connect.stripe.com/setup/e/acct_marc/abc'),
    );

    const response = await http()
      .post('/payout/onboarding')
      .set('Authorization', 'Bearer token');

    expect(response.status).toEqual(200);
    expect(response.body).toEqual({
      url: 'https://connect.stripe.com/setup/e/acct_marc/abc',
    });
    expect(sut.startOnboarding.lastCall?.accountId).toEqual(MARC);
  });

  it('answers 503 when Stripe does not answer', async () => {
    sut.givenSignedInAs(MARC);
    sut.startOnboarding.willResolve(Either.left(new PayoutUnavailableError()));

    const response = await http()
      .post('/payout/onboarding')
      .set('Authorization', 'Bearer token');

    expect(response.status).toEqual(503);
  });

  it('answers 409 when the dashboard is asked before Stripe validated the account', async () => {
    sut.givenSignedInAs(MARC);
    sut.openDashboard.willResolve(
      Either.left(new PayoutAccountNotReadyError()),
    );

    const response = await http()
      .post('/payout/dashboard')
      .set('Authorization', 'Bearer token');

    expect(response.status).toEqual(409);
  });

  it('opens nothing without a token', async () => {
    const responses = [
      await http().get('/payout'),
      await http().post('/payout/onboarding'),
      await http().post('/payout/dashboard'),
    ];

    expect(responses.map((response) => response.status)).toEqual([
      401, 401, 401,
    ]);
    expect(sut.startOnboarding.calls).toHaveLength(0);
  });
});
