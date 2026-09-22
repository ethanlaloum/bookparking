import * as request from 'supertest';

import { createControllerTestApp } from '../../../../../shared/test/http/createControllerTestApp';
import { createSessionControllerSUT } from './session.controller.sut';

const MARC_EMAIL = 'marc.d@example.com';
const WRONG_PASSWORD = 'Mauvais2026!';
const ORIGIN_NAMED_IN_THE_BODY = '203.0.113.7';

describe('SessionController @SPEC-002', () => {
  let sut: ReturnType<typeof createSessionControllerSUT>;
  let testApp: Awaited<ReturnType<typeof createControllerTestApp>>;

  const http = () => request(testApp.app.getHttpServer());

  beforeEach(async () => {
    sut = createSessionControllerSUT();
    testApp = await createControllerTestApp(sut.metadata, sut.authState);
  });

  afterEach(async () => {
    await testApp.close();
  });

  describe('POST /session', () => {
    it('counts a refused attempt for the origin that sent it, whatever the body names', async () => {
      sut.givenCredentialsAreRefused();

      const response = await http().post('/session').send({
        email: MARC_EMAIL,
        password: WRONG_PASSWORD,
        originKey: ORIGIN_NAMED_IN_THE_BODY,
      });

      expect(response.status).toEqual(401);
      sut.thenAttemptWasCountedForOrigin(ORIGIN_NAMED_IN_THE_BODY);
    });
  });
});
