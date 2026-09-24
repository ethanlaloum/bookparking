import {
  cleanDatabase,
  startTestDatabase,
  stopTestDatabase,
} from '../../../../infra/testcontainers-setup';
import { createKnexEmailOutboxSUT } from './KnexEmailOutbox.sut';

const MARC_EMAIL = 'marc.d@example.com';
const LEA_EMAIL = 'lea.t@example.com';
const PAUL_EMAIL = 'paul.r@example.com';
const SENT_EMAIL = 'envoye@example.com';
const FAILED_EMAIL = 'abandonne@example.com';

// Heure de Paris, UTC+2 en octobre.
const AT = (parisTime: string) => `2026-10-01T${parisTime}.000+02:00`;

describe('KnexEmailOutbox @SPEC-006', () => {
  beforeAll(async () => {
    await startTestDatabase();
  }, 120000);

  afterEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await stopTestDatabase();
  });

  it('leaves no email behind a transaction that fails @EX-006-05', async () => {
    const sut = createKnexEmailOutboxSUT();

    const outcome = await sut.whenEnqueuingInATransactionThatFails(
      MARC_EMAIL,
      AT('09:00:00'),
    );

    sut.thenTheTransactionFailedOnItsLaterWrite(outcome);
    await sut.thenOutgoingEmailsTableIsEmpty();
  });

  it('writes a queued email as pending with no attempt @EX-006-06', async () => {
    const sut = createKnexEmailOutboxSUT();

    const email = await sut.whenEnqueuing(MARC_EMAIL, AT('09:00:00'));

    await sut.thenRowIsPendingWelcome(email, MARC_EMAIL, AT('09:00:00'));
  });

  it('reads only pending emails, oldest first, one batch at a time @EX-006-09', async () => {
    const sut = createKnexEmailOutboxSUT();
    const sent = await sut.givenQueuedWelcome(SENT_EMAIL, AT('08:58:00'));
    const failed = await sut.givenQueuedWelcome(FAILED_EMAIL, AT('08:59:00'));
    await sut.givenQueuedWelcome(PAUL_EMAIL, AT('09:02:00'));
    const oldest = await sut.givenQueuedWelcome(MARC_EMAIL, AT('09:00:00'));
    const second = await sut.givenQueuedWelcome(LEA_EMAIL, AT('09:01:00'));
    await sut.givenMarkedSent(sent, AT('08:58:30'));
    await sut.givenMarkedFailed(failed, AT('08:59:30'));
    await sut.givenOneUnavailableAttempt(oldest);

    const queue = await sut.whenReadingTheQueue(2);

    sut.thenQueueReads(queue, [
      { email: oldest, attempts: 1 },
      { email: second, attempts: 0 },
    ]);
  });

  it('keeps the first sending time when an email is marked sent twice @EX-006-10', async () => {
    const sut = createKnexEmailOutboxSUT();
    const email = await sut.givenQueuedWelcome(MARC_EMAIL, AT('09:00:00'));
    await sut.givenMarkedSent(email, AT('09:00:30'));

    await sut.whenMarkingSent(email, AT('09:01:00'));

    await sut.thenRowIsSentAt(email, AT('09:00:30'));
  });
});
