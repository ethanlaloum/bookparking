import { createEnvironmentSUT } from './environment.sut';

const SENDER = 'Bookparking <bonjour@bookparking.fr>';

describe('environment.emailSending @SPEC-006', () => {
  let sut: ReturnType<typeof createEnvironmentSUT>;

  beforeEach(() => {
    sut = createEnvironmentSUT();
  });

  afterEach(() => {
    sut.tearDown();
  });

  it('refuses to start without a Resend key @EX-006-21', () => {
    sut.givenVariables({ MAIL_FROM: SENDER, RESEND_API_KEY: '' });

    const outcome = sut.whenReadingEmailSending();

    sut.thenStartIsRefusedNaming(outcome, 'RESEND_API_KEY');
  });

  it('starts with sending disabled and no key @EX-006-22', () => {
    sut.givenVariables({ EMAIL_SENDING: 'disabled' });

    const outcome = sut.whenReadingEmailSending();

    sut.thenSendingIsDisabled(outcome);
  });

  it('refuses a sender with no address @EX-006-23', () => {
    sut.givenVariables({ RESEND_API_KEY: 're_test_123', MAIL_FROM: SENDER });
    sut.thenSendingUses(sut.whenReadingEmailSending(), {
      apiKey: 're_test_123',
      from: SENDER,
    });

    sut.givenVariables({
      RESEND_API_KEY: 're_test_123',
      MAIL_FROM: 'Bookparking',
    });
    const outcome = sut.whenReadingEmailSending();

    sut.thenStartIsRefusedNaming(outcome, 'MAIL_FROM');
  });
});
