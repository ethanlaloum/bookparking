import * as request from 'supertest';

import { createControllerTestApp } from '../../../../../shared/test/http/createControllerTestApp';
import { createAccountControllerSUT } from './account.controller.sut';

const MARC_EMAIL = 'marc.d@example.com';
const OTHER_PASSWORD = 'Autre2026!';
const LEA_EMAIL = 'lea.t@example.com';
const SEVEN_CHAR_PASSWORD = 'Prom06!';
const EIGHT_CHAR_PASSWORD = 'Prom06!!';
const MARC_PASSWORD = 'Barla2026!';
const ADDRESS_WITHOUT_AT_SIGN = 'marc.d';

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
    it('refuses a password shorter than eight characters @EX-002-05', async () => {
      const response = await http()
        .post('/account')
        .send({ email: LEA_EMAIL, password: SEVEN_CHAR_PASSWORD });

      expect(response.status).toEqual(400);
      sut.thenNoAccountWasRegistered();
    });

    it('accepts a password of exactly eight characters @EX-002-06', async () => {
      sut.givenRegistrationSucceedsFor(LEA_EMAIL);

      const response = await http()
        .post('/account')
        .send({ email: LEA_EMAIL, password: EIGHT_CHAR_PASSWORD });

      expect(response.status).toEqual(201);
      sut.thenAccountWasRegisteredFor(LEA_EMAIL);
    });

    it('refuses an empty password @EX-002-09', async () => {
      const response = await http()
        .post('/account')
        .send({ email: LEA_EMAIL, password: '' });

      expect(response.status).toEqual(400);
      sut.thenNoAccountWasRegistered();
    });

    it('refuses an address with no at sign @EX-002-34', async () => {
      const response = await http()
        .post('/account')
        .send({ email: ADDRESS_WITHOUT_AT_SIGN, password: MARC_PASSWORD });

      expect(response.status).toEqual(400);
      sut.thenNoAccountWasRegistered();
    });

    it('refuses an empty address @EX-002-38', async () => {
      const response = await http()
        .post('/account')
        .send({ email: '', password: MARC_PASSWORD });

      expect(response.status).toEqual(400);
      sut.thenNoAccountWasRegistered();
    });
  });
});
