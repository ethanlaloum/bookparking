import { InvalidCredentialsError } from './errors/InvalidCredentialsError';
import { createSignInSUT } from './SignIn.sut';

const MARC_EMAIL = 'marc.d@example.com';
const MARC_PASSWORD = 'Barla2026!';
const WRONG_PASSWORD = 'Mauvais2026!';
const UNKNOWN_EMAIL = 'inconnu@example.com';

describe('SignIn @SPEC-002', () => {
  it('issues a token valid for seven days @EX-002-14', async () => {
    const sut = createSignInSUT();
    await sut.givenAccountFor(MARC_EMAIL, MARC_PASSWORD);

    const result = await sut.whenSigningIn({
      email: MARC_EMAIL,
      password: MARC_PASSWORD,
      at: new Date('2026-10-01T07:00:00.000Z'),
    });

    sut.thenResultIsRight(result);
    sut.thenTokenIsValidUntil(result, new Date('2026-10-08T07:00:00.000Z'));
  });

  it('refuses a wrong password without saying the account exists @EX-002-17', async () => {
    const sut = createSignInSUT();
    await sut.givenAccountFor(MARC_EMAIL, MARC_PASSWORD);

    const result = await sut.whenSigningIn({
      email: MARC_EMAIL,
      password: WRONG_PASSWORD,
    });

    sut.thenResultIsLeftWithError(result, InvalidCredentialsError);
    sut.thenNoTokenWasIssued();
  });

  it('refuses an unknown address with the same error as a wrong password @EX-002-18', async () => {
    const sut = createSignInSUT();
    await sut.givenAccountFor(MARC_EMAIL, MARC_PASSWORD);

    const wrongPassword = await sut.whenSigningIn({
      email: MARC_EMAIL,
      password: WRONG_PASSWORD,
    });
    const unknownAddress = await sut.whenSigningIn({
      email: UNKNOWN_EMAIL,
      password: MARC_PASSWORD,
    });

    sut.thenResultIsLeftWithError(unknownAddress, InvalidCredentialsError);
    sut.thenBothRefusalsAreIndistinguishable(wrongPassword, unknownAddress);
    sut.thenNoTokenWasIssued();
  });
});
