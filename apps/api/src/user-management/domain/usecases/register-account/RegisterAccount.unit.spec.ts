import { UnknownError } from '../../../../shared/error/errors/UnknownError';
import { WeakPasswordError } from '../../errors/WeakPasswordError';
import { HumanProofRejectedError } from './errors/HumanProofRejectedError';
import { TermsNotAcceptedError } from './errors/TermsNotAcceptedError';
import { EmailAlreadyUsedError } from './errors/EmailAlreadyUsedError';
import { createRegisterAccountSUT } from './RegisterAccount.sut';

const MARC_EMAIL = 'marc.d@example.com';
const MARC_PASSWORD = 'Barla2026!';
const LEA_EMAIL = 'lea.t@example.com';
const OTHER_PASSWORD = 'Autre2026!';
const MARC_EMAIL_CASED_AND_SPACED = ' Marc.D@Example.COM ';
const LEA_ACCENTED_EMAIL = 'Léa.T@Exemple.fr';
const LEA_ACCENTED_EMAIL_LOWERCASED = 'léa.t@exemple.fr';
const LONG_PASSWORD_WITH_ACCENTS_AND_EMOJI =
  'é'.repeat(66) + 'ü'.repeat(67) + '🚗'.repeat(67);

describe('RegisterAccount @SPEC-002', () => {
  it('creates an account for a new email address @EX-002-01', async () => {
    const sut = createRegisterAccountSUT();
    sut.givenNoAccountFor(MARC_EMAIL);

    const result = await sut.whenRegistering({
      email: MARC_EMAIL,
      password: MARC_PASSWORD,
      registeredAt: new Date('2026-10-01T07:00:00.000Z'),
    });

    sut.thenResultIsRight(result);
    sut.thenAccountExistsFor(MARC_EMAIL);
    sut.thenStoredPasswordIsNot(MARC_EMAIL, MARC_PASSWORD);
  });

  it('converts a repository failure into an unknown error @EX-002-08', async () => {
    const sut = createRegisterAccountSUT();
    sut.givenAccountRepositoryFailsToWrite();

    const result = await sut.whenRegistering({
      email: MARC_EMAIL,
      password: MARC_PASSWORD,
    });

    sut.thenResultIsLeftWithError(result, UnknownError);
    sut.thenNoAccountCreated();
  });

  it('accepts a long password with accents and emoji @EX-002-10', async () => {
    const sut = createRegisterAccountSUT();

    const result = await sut.whenRegistering({
      email: LEA_EMAIL,
      password: LONG_PASSWORD_WITH_ACCENTS_AND_EMOJI,
    });

    sut.thenResultIsRight(result);
    sut.thenStoredPasswordVerifiesAgainst(
      LEA_EMAIL,
      LONG_PASSWORD_WITH_ACCENTS_AND_EMOJI,
    );
  });
  it('refuses an email address that already has an account @EX-002-02', async () => {
    const sut = createRegisterAccountSUT();
    const existing = await sut.givenAccountFor(MARC_EMAIL, MARC_PASSWORD);

    const result = await sut.whenRegistering({
      email: MARC_EMAIL,
      password: OTHER_PASSWORD,
    });

    sut.thenResultIsLeftWithError(result, EmailAlreadyUsedError);
    sut.thenAccountIsUnchanged(existing);
  });

  it('treats a differently cased and spaced address as the same account @EX-002-07', async () => {
    const sut = createRegisterAccountSUT();
    await sut.givenAccountFor(MARC_EMAIL, MARC_PASSWORD);

    const result = await sut.whenRegistering({
      email: MARC_EMAIL_CASED_AND_SPACED,
      password: OTHER_PASSWORD,
    });

    sut.thenResultIsLeftWithError(result, EmailAlreadyUsedError);
    sut.thenOnlyOneAccountExistsFor(MARC_EMAIL);
  });

  it('normalises an accented address to a single account @EX-002-39', async () => {
    const sut = createRegisterAccountSUT();

    const created = await sut.whenRegistering({
      email: LEA_ACCENTED_EMAIL,
      password: MARC_PASSWORD,
    });

    sut.thenResultIsRight(created);
    sut.thenAccountExistsFor(LEA_ACCENTED_EMAIL_LOWERCASED);

    const second = await sut.whenRegistering({
      email: LEA_ACCENTED_EMAIL_LOWERCASED,
      password: OTHER_PASSWORD,
    });

    sut.thenResultIsLeftWithError(second, EmailAlreadyUsedError);
    sut.thenOnlyOneAccountExistsFor(LEA_ACCENTED_EMAIL_LOWERCASED);
  });
  it('makes the account usable without any address verification @EX-002-35', async () => {
    const sut = createRegisterAccountSUT();

    const result = await sut.whenRegistering({
      email: MARC_EMAIL,
      password: MARC_PASSWORD,
    });

    sut.thenResultIsRight(result);
    sut.thenAccountIsImmediatelyUsableAsOwner(MARC_EMAIL);
    sut.thenNoVerificationTokenWritten();
    sut.thenOnlyWelcomeEmailQueued();
  });
});

describe('RegisterAccount @SPEC-006', () => {
  const REGISTERED_AT = new Date('2026-10-01T07:00:00.000Z');

  it('queues a welcome email with the new account @EX-006-01', async () => {
    const sut = createRegisterAccountSUT();
    sut.givenNoAccountFor(MARC_EMAIL);

    const result = await sut.whenRegistering({
      email: MARC_EMAIL,
      password: MARC_PASSWORD,
      registeredAt: REGISTERED_AT,
    });

    sut.thenResultIsRight(result);
    sut.thenWelcomeEmailQueuedFor(MARC_EMAIL, REGISTERED_AT);
    sut.thenNothingQueuedContains(MARC_PASSWORD);
  });

  it('addresses the welcome email to the normalised address @EX-006-02', async () => {
    const sut = createRegisterAccountSUT();

    await sut.whenRegistering({
      email: MARC_EMAIL_CASED_AND_SPACED,
      registeredAt: REGISTERED_AT,
    });

    sut.thenWelcomeEmailQueuedFor(MARC_EMAIL, REGISTERED_AT);
  });

  it('queues nothing when the address already has an account @EX-006-03', async () => {
    const sut = createRegisterAccountSUT();
    sut.givenExistingAccountFor(MARC_EMAIL);

    const result = await sut.whenRegistering({ email: MARC_EMAIL });

    sut.thenResultIsLeftWithError(result, EmailAlreadyUsedError);
    sut.thenNoEmailQueued();
  });

  it('fails the registration when the email outbox is unreachable @EX-006-04', async () => {
    const sut = createRegisterAccountSUT();
    sut.givenEmailOutboxFailsToWrite();

    const result = await sut.whenRegistering({ email: MARC_EMAIL });

    sut.thenResultIsLeftWithError(result, UnknownError);
  });
});

describe('RegisterAccount @SPEC-007', () => {
  it('refuses a registration with a weak password @EX-007-10', async () => {
    const sut = createRegisterAccountSUT();

    const result = await sut.whenRegistering({
      email: MARC_EMAIL,
      password: 'motdepasse',
    });

    sut.thenResultIsLeftWithError(result, WeakPasswordError);
    sut.thenNoAccountCreated();
    sut.thenNoEmailQueued();
  });

  it('refuses a registration without an accepted proof @EX-007-17', async () => {
    const sut = createRegisterAccountSUT();
    sut.givenEveryHumanProofIsRejected();

    const result = await sut.whenRegistering({ email: MARC_EMAIL });

    sut.thenResultIsLeftWithError(result, HumanProofRejectedError);
    sut.thenProofWasPresented(1);
    sut.thenNoAccountCreated();
    sut.thenNoEmailQueued();
  });
});

describe('RegisterAccount @SPEC-008', () => {
  const REGISTERED_AT = new Date('2026-10-01T07:00:00.000Z');

  it('notes when the terms were accepted @EX-008-01', async () => {
    const sut = createRegisterAccountSUT();

    const result = await sut.whenRegistering({
      email: MARC_EMAIL,
      registeredAt: REGISTERED_AT,
      acceptsTerms: true,
    });

    sut.thenResultIsRight(result);
    sut.thenAccountAcceptedTermsAt(MARC_EMAIL, REGISTERED_AT);
  });

  it('refuses a registration without accepting the terms @EX-008-02', async () => {
    const sut = createRegisterAccountSUT();

    const result = await sut.whenRegistering({
      email: MARC_EMAIL,
      acceptsTerms: false,
    });

    sut.thenResultIsLeftWithError(result, TermsNotAcceptedError);
    sut.thenNoAccountCreated();
    sut.thenNoEmailQueued();
  });
});
