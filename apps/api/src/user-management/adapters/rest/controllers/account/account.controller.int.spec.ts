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
const MISTYPED_PASSWORD = 12345678;
const NON_OBJECT_BODY = ['lea.t@example.com', 'Promenade06!'];
const ADDRESS_OF_254_CHARACTERS = `${'a'.repeat(242)}@example.com`;
const ADDRESS_OF_255_CHARACTERS = `${'a'.repeat(243)}@example.com`;
const ADDRESS_CARRYING_A_QUOTE_AND_A_COMMENT_MARKER = "marc'--@example.com";
const ACCENTED_ADDRESS = 'Léa.T@Exemple.fr';
// Bien formée ; le cas d'usage, doublé ici, décide seul si elle est acceptée.
const HUMAN_PROOF = {
  algorithm: 'SHA-256',
  challenge: 'c'.repeat(64),
  salt: 'a1b2c3d4?expires=1790000000',
  number: 1234,
  signature: 's'.repeat(64),
};
const HUMAN_CHALLENGE = {
  algorithm: 'SHA-256' as const,
  challenge: 'c'.repeat(64),
  salt: 'a1b2c3d4?expires=1790000000',
  maxNumber: 50000,
  signature: 's'.repeat(64),
};

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

      const response = await http().post('/account').send({
        humanProof: HUMAN_PROOF,
        acceptsTerms: true,
        email: MARC_EMAIL,
        password: OTHER_PASSWORD,
      });

      expect(response.status).toEqual(409);
      expect(JSON.stringify(response.body)).not.toContain(MARC_EMAIL);
    });
    it('refuses a password shorter than eight characters @EX-002-05', async () => {
      const response = await http().post('/account').send({
        humanProof: HUMAN_PROOF,
        acceptsTerms: true,
        email: LEA_EMAIL,
        password: SEVEN_CHAR_PASSWORD,
      });

      expect(response.status).toEqual(400);
      sut.thenNoAccountWasRegistered();
    });

    it('accepts a password of exactly eight characters @EX-002-06', async () => {
      sut.givenRegistrationSucceedsFor(LEA_EMAIL);

      const response = await http().post('/account').send({
        humanProof: HUMAN_PROOF,
        acceptsTerms: true,
        email: LEA_EMAIL,
        password: EIGHT_CHAR_PASSWORD,
      });

      expect(response.status).toEqual(201);
      sut.thenAccountWasRegisteredFor(LEA_EMAIL);
    });

    it('refuses an empty password @EX-002-09', async () => {
      const response = await http().post('/account').send({
        humanProof: HUMAN_PROOF,
        acceptsTerms: true,
        email: LEA_EMAIL,
        password: '',
      });

      expect(response.status).toEqual(400);
      sut.thenNoAccountWasRegistered();
    });

    it('refuses an address with no at sign @EX-002-34', async () => {
      const response = await http().post('/account').send({
        humanProof: HUMAN_PROOF,
        acceptsTerms: true,
        email: ADDRESS_WITHOUT_AT_SIGN,
        password: MARC_PASSWORD,
      });

      expect(response.status).toEqual(400);
      sut.thenNoAccountWasRegistered();
    });

    it('refuses an empty address @EX-002-38', async () => {
      const response = await http().post('/account').send({
        humanProof: HUMAN_PROOF,
        acceptsTerms: true,
        email: '',
        password: MARC_PASSWORD,
      });

      expect(response.status).toEqual(400);
      sut.thenNoAccountWasRegistered();
    });
    it('keeps a mistyped password out of the validation response @EX-002-41', async () => {
      const response = await http().post('/account').send({
        humanProof: HUMAN_PROOF,
        acceptsTerms: true,
        email: LEA_EMAIL,
        password: MISTYPED_PASSWORD,
      });

      expect(response.status).toEqual(400);
      expect(JSON.stringify(response.body)).not.toContain('12345678');
      sut.thenNoAccountWasRegistered();
    });

    it('keeps a non-object request body out of the validation response @EX-002-42', async () => {
      const response = await http()
        .post('/account')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify(NON_OBJECT_BODY));

      expect(response.status).toEqual(400);
      expect(JSON.stringify(response.body)).not.toContain('Promenade06!');
      sut.thenNoAccountWasRegistered();
    });

    it('refuses an address of 255 characters @EX-002-36', async () => {
      const response = await http().post('/account').send({
        humanProof: HUMAN_PROOF,
        acceptsTerms: true,
        email: ADDRESS_OF_255_CHARACTERS,
        password: MARC_PASSWORD,
      });

      expect(response.status).toEqual(400);
      sut.thenNoAccountWasRegistered();
    });

    it('accepts an address of 254 characters @EX-002-37', async () => {
      sut.givenRegistrationSucceedsFor(ADDRESS_OF_254_CHARACTERS);

      const response = await http().post('/account').send({
        humanProof: HUMAN_PROOF,
        acceptsTerms: true,
        email: ADDRESS_OF_254_CHARACTERS,
        password: MARC_PASSWORD,
      });

      expect(response.status).toEqual(201);
    });

    it('refuses an address carrying a quote and a comment marker @EX-002-40', async () => {
      const response = await http().post('/account').send({
        humanProof: HUMAN_PROOF,
        acceptsTerms: true,
        email: ADDRESS_CARRYING_A_QUOTE_AND_A_COMMENT_MARKER,
        password: MARC_PASSWORD,
      });

      expect(response.status).toEqual(400);
      sut.thenNoAccountWasRegistered();
    });
    it('accepts an accented address at the HTTP boundary @EX-002-39', async () => {
      sut.givenRegistrationSucceedsFor(ACCENTED_ADDRESS);

      const response = await http().post('/account').send({
        humanProof: HUMAN_PROOF,
        acceptsTerms: true,
        email: ACCENTED_ADDRESS,
        password: MARC_PASSWORD,
      });

      expect(response.status).toEqual(201);
      sut.thenAccountWasRegisteredFor(ACCENTED_ADDRESS);
    });
  });
  describe('POST /account/password', () => {
    it('responds 401 to a password change with no token @EX-002-31', async () => {
      const response = await http()
        .post('/account/password')
        .send({ currentPassword: MARC_PASSWORD, newPassword: 'Barla2027#' });

      expect(response.status).toEqual(401);
      sut.thenNoPasswordWasChanged();
    });
  });
});

describe('AccountController @SPEC-007', () => {
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

  it('serves a challenge and requires a proof to register @EX-007-18', async () => {
    sut.givenChallenge(HUMAN_CHALLENGE);

    const challenge = await http().get('/account/human-challenge');
    const withoutProof = await http()
      .post('/account')
      .send({ email: MARC_EMAIL, password: MARC_PASSWORD, acceptsTerms: true });

    expect(challenge.status).toEqual(200);
    expect(challenge.body).toEqual(HUMAN_CHALLENGE);
    expect(withoutProof.status).toEqual(400);
    expect(JSON.stringify(withoutProof.body)).not.toContain(MARC_PASSWORD);
    sut.thenNoAccountWasRegistered();
  });
});

describe('AccountController @SPEC-008', () => {
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

  it('refuses a registration that says nothing of the terms @EX-008-04', async () => {
    sut.givenRegistrationSucceedsFor(MARC_EMAIL);

    const response = await http().post('/account').send({
      humanProof: HUMAN_PROOF,
      email: MARC_EMAIL,
      password: MARC_PASSWORD,
    });

    expect(response.status).toEqual(400);
    sut.thenNoAccountWasRegistered();
  });
});
