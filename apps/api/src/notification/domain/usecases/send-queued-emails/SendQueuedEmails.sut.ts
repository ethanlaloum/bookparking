import { Either } from 'effect/index';

import { InMemoryEmailOutbox } from '../../../../shared/email-outbox/adapters/repositories/InMemoryEmailOutbox';
import { OutgoingEmail } from '../../../../shared/email-outbox/domain/entities/OutgoingEmail';
import { InMemoryEmailSender } from '../../../adapters/services/email-sender/InMemoryEmailSender';
import { EmailDelivery } from '../../ports/EmailSender';
import { SendQueuedEmails } from './SendQueuedEmails';

export const createSendQueuedEmailsSUT = () => {
  const emailOutbox = new InMemoryEmailOutbox();
  const emailSender = new InMemoryEmailSender();

  const testConstants = {
    siteUrlForTest: 'https://bookparking.fr',
  };

  const sendQueuedEmails = new SendQueuedEmails(
    emailOutbox,
    emailSender,
    testConstants.siteUrlForTest,
  );

  const stateOf = (email: OutgoingEmail) => {
    const found = emailOutbox.emails.find((stored) => stored.id === email.id);
    if (found === undefined) throw new Error('email is not in the outbox');
    return found.toState();
  };

  return {
    context: { emailOutbox, emailSender, testConstants },

    async givenWelcomeEmailQueuedFor(
      recipient: string,
      queuedAt: string,
    ): Promise<OutgoingEmail> {
      const email = OutgoingEmail.welcome({
        recipient,
        queuedAt: new Date(queuedAt),
      });
      await emailOutbox.enqueue(email);
      return email;
    },

    givenResendAnswers(...deliveries: EmailDelivery[]) {
      emailSender.answerNext(...deliveries);
    },

    async whenSweepingAt(now: string) {
      const result = await sendQueuedEmails.execute({ now: new Date(now) });
      if (Either.isLeft(result)) throw result.left;
      return result.right;
    },

    thenResendReceived(
      expected: { to: string; subject: string; idempotencyKey: string }[],
    ) {
      expect(
        emailSender.received.map(({ to, subject, idempotencyKey }) => ({
          to,
          subject,
          idempotencyKey,
        })),
      ).toEqual(expected);
    },

    thenResendReceivedCount(count: number) {
      expect(emailSender.received).toHaveLength(count);
    },

    thenEmailIsSentAt(email: OutgoingEmail, sentAt: string) {
      const state = stateOf(email);
      expect(state.status).toEqual('SENT');
      expect(state.sentAt).toEqual(new Date(sentAt));
    },

    thenEmailIsStillQueued(email: OutgoingEmail, attempts: number) {
      const state = stateOf(email);
      expect(state.status).toEqual('PENDING');
      expect(state.attempts).toEqual(attempts);
    },

    thenEmailIsAbandonedAt(email: OutgoingEmail, failedAt: string) {
      const state = stateOf(email);
      expect(state.status).toEqual('FAILED');
      expect(state.failedAt).toEqual(new Date(failedAt));
    },
  };
};
