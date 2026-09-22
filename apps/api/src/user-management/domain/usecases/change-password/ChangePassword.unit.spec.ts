import { InvalidCredentialsError } from '../sign-in/errors/InvalidCredentialsError';
import { createChangePasswordSUT } from './ChangePassword.sut';
import { WeakPasswordError } from './errors/WeakPasswordError';

const MARC_EMAIL = 'marc.d@example.com';
const CURRENT_PASSWORD = 'Barla2026!';
const NEW_PASSWORD = 'Barla2027#';
const WRONG_PASSWORD = 'Mauvais2026!';
const SEVEN_CHAR_PASSWORD = 'Prom06!';

describe('ChangePassword @SPEC-002', () => {
  it('invalidates the former password after a change @EX-002-29', async () => {
    const sut = createChangePasswordSUT();
    await sut.givenAccountFor(MARC_EMAIL, CURRENT_PASSWORD);

    const result = await sut.whenChangingPassword({
      email: MARC_EMAIL,
      currentPassword: CURRENT_PASSWORD,
      newPassword: NEW_PASSWORD,
    });

    sut.thenResultIsRight(result);
    await sut.thenSignInFailsWith(MARC_EMAIL, CURRENT_PASSWORD);
    await sut.thenSignInSucceedsWith(MARC_EMAIL, NEW_PASSWORD);
  });

  it('refuses a password change without the current password @EX-002-30', async () => {
    const sut = createChangePasswordSUT();
    await sut.givenAccountFor(MARC_EMAIL, CURRENT_PASSWORD);

    const result = await sut.whenChangingPassword({
      email: MARC_EMAIL,
      currentPassword: WRONG_PASSWORD,
      newPassword: NEW_PASSWORD,
    });

    sut.thenResultIsLeftWithError(result, InvalidCredentialsError);
    await sut.thenSignInSucceedsWith(MARC_EMAIL, CURRENT_PASSWORD);
  });

  it('refuses a new password shorter than eight characters @EX-002-32', async () => {
    const sut = createChangePasswordSUT();
    await sut.givenAccountFor(MARC_EMAIL, CURRENT_PASSWORD);

    const result = await sut.whenChangingPassword({
      email: MARC_EMAIL,
      currentPassword: CURRENT_PASSWORD,
      newPassword: SEVEN_CHAR_PASSWORD,
    });

    sut.thenResultIsLeftWithError(result, WeakPasswordError);
    await sut.thenSignInSucceedsWith(MARC_EMAIL, CURRENT_PASSWORD);
  });

  it('keeps a token issued before the password change valid @EX-002-33', async () => {
    const sut = createChangePasswordSUT();
    await sut.givenAccountFor(MARC_EMAIL, CURRENT_PASSWORD);
    const issued = await sut.givenTokenIssuedAt(
      MARC_EMAIL,
      CURRENT_PASSWORD,
      new Date('2026-10-01T07:00:00.000Z'),
    );

    await sut.whenChangingPassword({
      email: MARC_EMAIL,
      currentPassword: CURRENT_PASSWORD,
      newPassword: NEW_PASSWORD,
    });

    sut.thenTokenIsStillAccepted(issued, new Date('2026-10-02T08:01:00.000Z'));
  });
});
