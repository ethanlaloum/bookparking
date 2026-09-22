import type { Knex } from 'knex';

import { GenericTransaction } from '../../../../shared/unit-of-work/GenericTransaction';
import { Account } from '../../../domain/entities/Account';
import { AccountRepository } from '../../../domain/ports/AccountRepository';
import { EmailAlreadyUsedError } from '../../../domain/usecases/register-account/errors/EmailAlreadyUsedError';
import { SchemaAccountRepository } from './SchemaAccountRepository';

const UNIQUE_VIOLATION = '23505';
const EMAIL_UNIQUE_INDEX = 'accounts_email_unique';

const isEmailUniqueViolation = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  (error as { code?: unknown }).code === UNIQUE_VIOLATION &&
  (error as { constraint?: unknown }).constraint === EMAIL_UNIQUE_INDEX;

type AccountRow = Omit<SchemaAccountRepository, 'created_at' | 'updated_at'>;

export class KnexAccountRepository implements AccountRepository {
  private readonly tableName = 'accounts';

  constructor(private readonly connection: Knex<SchemaAccountRepository>) {}

  public async create(
    account: Account,
    trx?: GenericTransaction,
  ): Promise<void> {
    const query = this.connection(this.tableName).insert(
      KnexAccountRepository.toRow(account),
    );
    if (trx) query.transacting(trx);
    try {
      await query;
    } catch (error: unknown) {
      if (isEmailUniqueViolation(error)) {
        throw new EmailAlreadyUsedError();
      }
      throw error;
    }
  }

  public async findByEmail(
    email: string,
    trx?: GenericTransaction,
  ): Promise<Account | null> {
    const query = this.connection<SchemaAccountRepository>(this.tableName)
      .where({ email: Account.normalizeEmail(email) })
      .first();
    if (trx) query.transacting(trx);
    const row = await query;
    if (!row) return null;
    return KnexAccountRepository.toEntity(row);
  }

  private static toRow(account: Account): AccountRow {
    const state = account.toState();
    return {
      id: state.id,
      email: state.email,
      password_hash: state.passwordHash,
      registered_at: state.registeredAt,
    };
  }

  public async findById(
    accountId: string,
    trx?: GenericTransaction,
  ): Promise<Account | null> {
    const query = this.connection<SchemaAccountRepository>(this.tableName)
      .where({ id: accountId })
      .first();
    if (trx) query.transacting(trx);
    const row = await query;
    if (!row) return null;
    return KnexAccountRepository.toEntity(row);
  }

  public async replacePasswordHash(
    accountId: string,
    passwordHash: string,
    trx?: GenericTransaction,
  ): Promise<void> {
    const query = this.connection(this.tableName)
      .where({ id: accountId })
      .update({ password_hash: passwordHash });
    if (trx) query.transacting(trx);
    await query;
  }

  private static toEntity(row: SchemaAccountRepository): Account {
    return Account.fromState({
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      registeredAt: new Date(row.registered_at),
    });
  }
}
