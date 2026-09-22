import * as request from 'supertest';

import { createControllerTestApp } from '../../../../../shared/test/http/createControllerTestApp';
import {
  createRentalRequestControllerSUT,
  LEA_ACCOUNT_ID,
  MARC_ACCOUNT_ID,
} from './rental-request.controller.sut';

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
        .send({ ...RENTAL_REQUEST_BODY, renterId: MARC_ACCOUNT_ID });

      expect(response.status).toEqual(201);
      sut.thenRentalRequestWasMadeFor(LEA_ACCOUNT_ID);
      sut.thenBodyRenterIdWasIgnored(MARC_ACCOUNT_ID);
    });
  });
});
