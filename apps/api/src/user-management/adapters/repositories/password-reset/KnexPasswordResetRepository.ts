import type { Knex } from 'knex';

import { GenericTransaction } from '../../../../shared/unit-of-work/GenericTransaction';
import { PasswordReset } from '../../../domain/entities/PasswordReset';
import { PasswordResetRepository } from '../../../domain/ports/PasswordResetRepository';
import { SchemaPasswordResetRepository } from './SchemaPasswordResetRepository';

export class KnexPasswordResetRepository implements PasswordResetRepository {
  private readonly tableName = 'password_resets';

  constructor(
    private readonly connection: Knex<SchemaPasswordResetRepository>,
  ) {}

  public async create(
    reset: PasswordReset,
    trx?: GenericTransaction,
  ): Promise<void> {
    const state = reset.toState();
    const query = this.connection(this.tableName).insert({
      token_hash: state.tokenHash,
      account_id: state.accountId,
      requested_at: state.requestedAt,
      expires_at: state.expiresAt,
      spent_at: state.spentAt,
    });
    if (trx) query.transacting(trx);
    await query;
  }

  public async findByTokenHash(
    tokenHash: string,
    trx?: GenericTransaction,
  ): Promise<PasswordReset | null> {
    const query = this.connection<SchemaPasswordResetRepository>(this.tableName)
      .where({ token_hash: tokenHash })
      .first();
    if (trx) query.transacting(trx);
    const row = await query;
    return row ? KnexPasswordResetRepository.toEntity(row) : null;
  }

  public async findLatestByAccountId(
    accountId: string,
    trx?: GenericTransaction,
  ): Promise<PasswordReset | null> {
    const query = this.connection<SchemaPasswordResetRepository>(this.tableName)
      .where({ account_id: accountId })
      .orderBy('requested_at', 'desc')
      .first();
    if (trx) query.transacting(trx);
    const row = await query;
    return row ? KnexPasswordResetRepository.toEntity(row) : null;
  }

  public async spendUnspentByAccountId(
    accountId: string,
    spentAt: Date,
    trx?: GenericTransaction,
  ): Promise<string[]> {
    const query = this.connection<SchemaPasswordResetRepository>(this.tableName)
      .where({ account_id: accountId })
      .whereNull('spent_at')
      .update({ spent_at: spentAt })
      .returning('token_hash');
    if (trx) query.transacting(trx);
    const rows = (await query) as Pick<
      SchemaPasswordResetRepository,
      'token_hash'
    >[];
    return rows.map((row) => row.token_hash);
  }

  private static toEntity(row: SchemaPasswordResetRepository): PasswordReset {
    return PasswordReset.fromState({
      tokenHash: row.token_hash,
      accountId: row.account_id,
      requestedAt: new Date(row.requested_at),
      expiresAt: new Date(row.expires_at),
      spentAt: row.spent_at === null ? null : new Date(row.spent_at),
    });
  }
}
