import * as request from 'supertest';

import { createControllerTestApp } from '../../../../../shared/test/http/createControllerTestApp';
import { WeakPasswordError } from '../../../../domain/errors/WeakPasswordError';
import { InvalidPasswordResetTokenError } from '../../../../domain/usecases/reset-password/errors/InvalidPasswordResetTokenError';
import { createPasswordResetControllerSUT } from './password-reset.controller.sut';

const MARC_EMAIL = 'marc.d@example.com';
const NEW_PASSWORD = 'Promenade2027#';

describe('PasswordResetController', () => {
  let sut: ReturnType<typeof createPasswordResetControllerSUT>;
  let testApp: Awaited<ReturnType<typeof createControllerTestApp>>;

  const http = () => request(testApp.app.getHttpServer());

  beforeEach(async () => {
    sut = createPasswordResetControllerSUT();
    testApp = await createControllerTestApp(sut.metadata, sut.authState);
  });

  afterEach(async () => {
    await testApp.close();
  });

  describe('POST /account/password-reset', () => {
    it('answers 204 and passes the address on, with no token needed', async () => {
      sut.givenResetRequestsSucceed();

      const response = await http()
        .post('/account/password-reset')
        .send({ email: MARC_EMAIL });

      sut.thenResponseIs(response, { status: 204, body: {} });
      sut.thenResetWasRequestedFor([MARC_EMAIL]);
    });

    it('refuses an address that is not text, without repeating it', async () => {
      const response = await http()
        .post('/account/password-reset')
        .send({ email: 1234567 });

      sut.thenResponseIs(response, {
        status: 400,
        body: { statusCode: 400, message: 'email: Adresse e-mail invalide' },
      });
      sut.thenResetWasRequestedFor([]);
    });

    it('answers 500 when the request cannot be recorded', async () => {
      sut.givenResetRequestsFail();

      const response = await http()
        .post('/account/password-reset')
        .send({ email: MARC_EMAIL });

      sut.thenResponseIs(response, {
        status: 500,
        body: {
          statusCode: 500,
          message: 'La demande de réinitialisation a échoué',
        },
      });
    });
  });

  describe('POST /account/password-reset/confirmation', () => {
    it('answers 204 and passes the link and the new password on', async () => {
      sut.givenResetsSucceed();

      const response = await http()
        .post('/account/password-reset/confirmation')
        .send({ token: 'token-1', newPassword: NEW_PASSWORD });

      sut.thenResponseIs(response, { status: 204, body: {} });
      sut.thenPasswordWasResetWith([
        { token: 'token-1', newPassword: NEW_PASSWORD },
      ]);
    });

    it('answers 400 with its message to a link that is no longer valid', async () => {
      sut.givenResetsAreRefusedWith(new InvalidPasswordResetTokenError());

      const response = await http()
        .post('/account/password-reset/confirmation')
        .send({ token: 'token-1', newPassword: NEW_PASSWORD });

      sut.thenResponseIs(response, {
        status: 400,
        body: {
          statusCode: 400,
          message:
            "Ce lien de réinitialisation n'est plus valable. Demandez-en un nouveau.",
        },
      });
    });

    it('answers 400 with its message to a weak password', async () => {
      sut.givenResetsAreRefusedWith(new WeakPasswordError('WEAK'));

      const response = await http()
        .post('/account/password-reset/confirmation')
        .send({ token: 'token-1', newPassword: 'motdepasse' });

      sut.thenResponseIs(response, {
        status: 400,
        body: {
          statusCode: 400,
          message:
            'Ce mot de passe est trop faible : allongez-le, ou mêlez minuscules, majuscules, chiffres et symboles',
        },
      });
    });

    it('refuses a password that is not text, without repeating it', async () => {
      const response = await http()
        .post('/account/password-reset/confirmation')
        .send({ token: 'token-1', newPassword: 12345678 });

      sut.thenResponseIs(response, {
        status: 400,
        body: {
          statusCode: 400,
          message: 'newPassword: Nouveau mot de passe invalide',
        },
      });
      sut.thenPasswordWasResetWith([]);
    });
  });
});
