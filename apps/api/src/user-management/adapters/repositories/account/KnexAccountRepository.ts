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

  private static toRow(account: Account): AccountRow {
    const state = account.toState();
    return {
      id: state.id,
      email: state.email,
      password_hash: state.passwordHash,
      registered_at: state.registeredAt,
    };
  }
}
