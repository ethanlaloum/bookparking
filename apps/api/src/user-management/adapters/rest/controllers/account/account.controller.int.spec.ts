import * as request from 'supertest';

import { createControllerTestApp } from '../../../../../shared/test/http/createControllerTestApp';
import { createAccountControllerSUT } from './account.controller.sut';

const MARC_EMAIL = 'marc.d@example.com';
const OTHER_PASSWORD = 'Autre2026!';

describe('AccountController @SPEC-002', () => {
  let sut: ReturnType<typeof createAccountControllerSUT>;
  let testApp: Awaited<ReturnType<typeof createControllerTestApp>>;

  const http = () => request(testApp.app.getHttpServer());

  beforeEach(async () => {
    sut = createAccountControllerSUT();
    testApp = await createControllerTestApp(sut.metadata, sut.authState);
  });

  afterEach(async () => {
    await testApp.close();
  });

  describe('POST /account', () => {
    it('responds 409 when the email address already has an account @EX-002-04', async () => {
      sut.givenAccountAlreadyExistsFor(MARC_EMAIL);

      const response = await http()
        .post('/account')
        .send({ email: MARC_EMAIL, password: OTHER_PASSWORD });

      expect(response.status).toEqual(409);
      expect(JSON.stringify(response.body)).not.toContain(MARC_EMAIL);
    });
  });
});
