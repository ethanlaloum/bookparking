import type { Knex } from 'knex';

import { GenericTransaction } from '../../../unit-of-work/GenericTransaction';
import {
  OutgoingEmail,
  OutgoingEmailKind,
  OutgoingEmailStatus,
} from '../../domain/entities/OutgoingEmail';
import { EmailOutbox } from '../../domain/ports/EmailOutbox';
import { SchemaEmailOutbox } from './SchemaEmailOutbox';

type OutgoingEmailRow = Omit<SchemaEmailOutbox, 'created_at' | 'updated_at'>;

const dateOrNull = (value: Date | string | null): Date | null =>
  value === null ? null : new Date(value);

export class KnexEmailOutbox implements EmailOutbox {
  private readonly tableName = 'outgoing_emails';

  constructor(private readonly connection: Knex<SchemaEmailOutbox>) {}

  public async enqueue(
    email: OutgoingEmail,
    trx?: GenericTransaction,
  ): Promise<void> {
    const query = this.connection(this.tableName).insert(
      KnexEmailOutbox.toRow(email),
    );
    if (trx) query.transacting(trx);
    await query;
  }

  public async findQueued(limit: number): Promise<OutgoingEmail[]> {
    const rows = await this.connection<SchemaEmailOutbox>(this.tableName)
      .where({ status: 'PENDING' })
      .orderBy([
        { column: 'queued_at', order: 'asc' },
        { column: 'id', order: 'asc' },
      ])
      .limit(limit);
    return rows.map(KnexEmailOutbox.toEntity);
  }

  public async markSent(emailId: string, sentAt: Date): Promise<void> {
    await this.leavePending(emailId, { status: 'SENT', sent_at: sentAt });
  }

  public async recordUnavailable(emailId: string): Promise<void> {
    await this.leavePending(emailId, {});
  }

  public async markFailed(emailId: string, failedAt: Date): Promise<void> {
    await this.leavePending(emailId, { status: 'FAILED', failed_at: failedAt });
  }

  // Chaque essai compte, qu'il réussisse ou non. Le filtre `PENDING` fait
  // qu'une transition rejouée — deux balayages, deux instances — n'écrit rien.
  private async leavePending(
    emailId: string,
    change: Partial<Pick<OutgoingEmailRow, 'status' | 'sent_at' | 'failed_at'>>,
  ): Promise<void> {
    await this.connection(this.tableName)
      .where({ id: emailId, status: 'PENDING' })
      .update({
        ...change,
        attempts: this.connection.raw('attempts + 1'),
        updated_at: this.connection.fn.now(),
      });
  }

  private static toRow(email: OutgoingEmail): OutgoingEmailRow {
    const state = email.toState();
    return {
      id: state.id,
      kind: state.kind,
      recipient: state.recipient,
      status: state.status,
      attempts: state.attempts,
      queued_at: state.queuedAt,
      sent_at: state.sentAt,
      failed_at: state.failedAt,
    };
  }

  private static toEntity(row: SchemaEmailOutbox): OutgoingEmail {
    return OutgoingEmail.fromState({
      id: row.id,
      kind: row.kind as OutgoingEmailKind,
      recipient: row.recipient,
      status: row.status as OutgoingEmailStatus,
      attempts: row.attempts,
      queuedAt: new Date(row.queued_at),
      sentAt: dateOrNull(row.sent_at),
      failedAt: dateOrNull(row.failed_at),
    });
  }
}
