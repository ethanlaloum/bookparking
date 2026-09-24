import { createSendQueuedEmailsSUT } from './SendQueuedEmails.sut';

const MARC_EMAIL = 'marc.d@example.com';
// Heure de Paris, UTC+2 en octobre : 09:00 à Paris est 07:00Z.
const QUEUED_AT = '2026-10-01T07:00:00.000Z';
const FIRST_SWEEP = '2026-10-01T07:00:30.000Z';
const SECOND_SWEEP = '2026-10-01T07:01:00.000Z';
const NEXT_DAY_JUST_BEFORE = '2026-10-02T06:59:30.000Z';
const NEXT_DAY_SAME_TIME = '2026-10-02T07:00:00.000Z';

describe('SendQueuedEmails @SPEC-006', () => {
  it('sends the welcome email and marks it sent @EX-006-07', async () => {
    const sut = createSendQueuedEmailsSUT();
    const email = await sut.givenWelcomeEmailQueuedFor(MARC_EMAIL, QUEUED_AT);

    await sut.whenSweepingAt(FIRST_SWEEP);

    sut.thenResendReceived([
      {
        to: MARC_EMAIL,
        subject: 'Bienvenue sur Bookparking',
        idempotencyKey: email.id,
      },
    ]);
    sut.thenEmailIsSentAt(email, FIRST_SWEEP);
  });

  it('sends an email swept twice only once @EX-006-08', async () => {
    const sut = createSendQueuedEmailsSUT();
    await sut.givenWelcomeEmailQueuedFor(MARC_EMAIL, QUEUED_AT);

    await sut.whenSweepingAt(FIRST_SWEEP);
    await sut.whenSweepingAt(SECOND_SWEEP);

    sut.thenResendReceivedCount(1);
  });

  it('keeps an email Resend cannot take and sends it on the next sweep @EX-006-12', async () => {
    const sut = createSendQueuedEmailsSUT();
    const email = await sut.givenWelcomeEmailQueuedFor(MARC_EMAIL, QUEUED_AT);
    sut.givenResendAnswers('UNAVAILABLE', 'ACCEPTED');

    await sut.whenSweepingAt(FIRST_SWEEP);
    sut.thenEmailIsStillQueued(email, 1);

    await sut.whenSweepingAt(SECOND_SWEEP);
    sut.thenEmailIsSentAt(email, SECOND_SWEEP);
  });

  it('abandons an email Resend refuses @EX-006-13', async () => {
    const sut = createSendQueuedEmailsSUT();
    const email = await sut.givenWelcomeEmailQueuedFor(MARC_EMAIL, QUEUED_AT);
    sut.givenResendAnswers('REFUSED');

    await sut.whenSweepingAt(FIRST_SWEEP);
    await sut.whenSweepingAt(SECOND_SWEEP);

    sut.thenEmailIsAbandonedAt(email, FIRST_SWEEP);
    sut.thenResendReceivedCount(1);
  });

  it('keeps retrying an email just short of 24 hours in the queue @EX-006-14', async () => {
    const sut = createSendQueuedEmailsSUT();
    const email = await sut.givenWelcomeEmailQueuedFor(MARC_EMAIL, QUEUED_AT);
    sut.givenResendAnswers('UNAVAILABLE');

    await sut.whenSweepingAt(NEXT_DAY_JUST_BEFORE);

    sut.thenEmailIsStillQueued(email, 1);
  });

  it('abandons an email still failing 24 hours after it was queued @EX-006-15', async () => {
    const sut = createSendQueuedEmailsSUT();
    const email = await sut.givenWelcomeEmailQueuedFor(MARC_EMAIL, QUEUED_AT);
    sut.givenResendAnswers('UNAVAILABLE');

    await sut.whenSweepingAt(NEXT_DAY_SAME_TIME);

    sut.thenEmailIsAbandonedAt(email, NEXT_DAY_SAME_TIME);
  });
});
