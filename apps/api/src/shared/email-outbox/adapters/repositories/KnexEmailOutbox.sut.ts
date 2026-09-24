import { getTestDbConnection } from '../../../../infra/testcontainers-setup';
import { KnexUnitOfWork } from '../../../unit-of-work/KnexUnitOfWork';
import { OutgoingEmail } from '../../domain/entities/OutgoingEmail';
import { KnexEmailOutbox } from './KnexEmailOutbox';
import { SchemaEmailOutbox } from './SchemaEmailOutbox';

const TABLE = 'outgoing_emails';
const LATER_WRITE_FAILURE = 'a later write of the same transaction fails';

export const createKnexEmailOutboxSUT = () => {
  const testDbConnection = getTestDbConnection();
  const emailOutbox = new KnexEmailOutbox(testDbConnection);
  const unitOfWork = new KnexUnitOfWork(testDbConnection);

  const welcomeFor = (recipient: string, queuedAt: string) =>
    OutgoingEmail.welcome({ recipient, queuedAt: new Date(queuedAt) });

  const rowOf = async (email: OutgoingEmail) =>
    testDbConnection<SchemaEmailOutbox>(TABLE).where({ id: email.id }).first();

  return {
    context: { testDbConnection, emailOutbox },

    async givenQueuedWelcome(
      recipient: string,
      queuedAt: string,
    ): Promise<OutgoingEmail> {
      const email = welcomeFor(recipient, queuedAt);
      await emailOutbox.enqueue(email);
      return email;
    },

    async givenMarkedSent(email: OutgoingEmail, sentAt: string) {
      await emailOutbox.markSent(email.id, new Date(sentAt));
    },

    async givenMarkedFailed(email: OutgoingEmail, failedAt: string) {
      await emailOutbox.markFailed(email.id, new Date(failedAt));
    },

    async givenOneUnavailableAttempt(email: OutgoingEmail) {
      await emailOutbox.recordUnavailable(email.id);
    },

    // Rend ce que la transaction a vu d'elle-même avant d'échouer, et l'erreur
    // qui l'a fait échouer : sans l'un et l'autre, une file qui ignorerait la
    // transaction — et attendrait en vain l'unique connexion du pool de test —
    // laisserait aussi la table vide, pour une tout autre raison.
    async whenEnqueuingInATransactionThatFails(
      recipient: string,
      queuedAt: string,
    ): Promise<{ rowsSeenInside: number; failure: unknown }> {
      let rowsSeenInside = -1;
      const failure = await unitOfWork
        .process(async (trx) => {
          await emailOutbox.enqueue(welcomeFor(recipient, queuedAt), trx);
          rowsSeenInside = (await trx(TABLE)).length;
          throw new Error(LATER_WRITE_FAILURE);
        })
        .then(
          () => null,
          (error: unknown) => error,
        );
      return { rowsSeenInside, failure };
    },

    thenTheTransactionFailedOnItsLaterWrite(outcome: {
      rowsSeenInside: number;
      failure: unknown;
    }) {
      expect(outcome.rowsSeenInside).toEqual(1);
      expect((outcome.failure as Error).message).toEqual(LATER_WRITE_FAILURE);
    },

    async whenEnqueuing(
      recipient: string,
      queuedAt: string,
    ): Promise<OutgoingEmail> {
      const email = welcomeFor(recipient, queuedAt);
      await emailOutbox.enqueue(email);
      return email;
    },

    async whenReadingTheQueue(limit: number) {
      return emailOutbox.findQueued(limit);
    },

    async whenMarkingSent(email: OutgoingEmail, sentAt: string) {
      await emailOutbox.markSent(email.id, new Date(sentAt));
    },

    async thenOutgoingEmailsTableIsEmpty() {
      expect(await testDbConnection(TABLE)).toEqual([]);
    },

    async thenRowIsPendingWelcome(
      email: OutgoingEmail,
      recipient: string,
      queuedAt: string,
    ) {
      const row = await rowOf(email);
      expect({
        kind: row?.kind,
        status: row?.status,
        recipient: row?.recipient,
        queuedAt: new Date(row?.queued_at ?? ''),
        attempts: row?.attempts,
        sentAt: row?.sent_at,
        failedAt: row?.failed_at,
      }).toEqual({
        kind: 'WELCOME',
        status: 'PENDING',
        recipient,
        queuedAt: new Date(queuedAt),
        attempts: 0,
        sentAt: null,
        failedAt: null,
      });
    },

    thenQueueReads(
      queue: OutgoingEmail[],
      expected: { email: OutgoingEmail; attempts: number }[],
    ) {
      expect(
        queue.map((email) => ({
          id: email.id,
          attempts: email.toState().attempts,
        })),
      ).toEqual(
        expected.map(({ email, attempts }) => ({ id: email.id, attempts })),
      );
    },

    async thenRowIsSentAt(email: OutgoingEmail, sentAt: string) {
      const row = await rowOf(email);
      expect(row?.status).toEqual('SENT');
      expect(new Date(row?.sent_at ?? '')).toEqual(new Date(sentAt));
      expect(row?.attempts).toEqual(1);
    },
  };
};
