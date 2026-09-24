import { createResendEmailSenderSUT } from './ResendEmailSender.sut';

describe('ResendEmailSender @SPEC-006', () => {
  it('posts the email to Resend with the key, the sender and the idempotency key @EX-006-11', async () => {
    const sut = createResendEmailSenderSUT();
    sut.givenResendAnswers(200, { id: 'resend-email-id' });

    const delivery = await sut.whenSending();

    sut.thenRequestWentToResend();
    sut.thenDeliveryIs(delivery, 'ACCEPTED');
  });

  it('reads a rate limit as unavailable @EX-006-16', async () => {
    const sut = createResendEmailSenderSUT();
    sut.givenResendAnswers(429, { name: 'rate_limit_exceeded' });

    const delivery = await sut.whenSending();

    sut.thenDeliveryIs(delivery, 'UNAVAILABLE');
  });

  it('reads a network failure as unavailable @EX-006-17', async () => {
    const sut = createResendEmailSenderSUT();
    sut.givenTheNetworkFails();

    const delivery = await sut.whenSending();

    sut.thenDeliveryIs(delivery, 'UNAVAILABLE');
  });

  it('reads an invalid address as refused @EX-006-18', async () => {
    const sut = createResendEmailSenderSUT();
    sut.givenResendAnswers(422, { name: 'validation_error' });

    const delivery = await sut.whenSending();

    sut.thenDeliveryIs(delivery, 'REFUSED');
  });
});
