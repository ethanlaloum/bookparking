import { GenericTransaction } from '../../../shared/unit-of-work/GenericTransaction';
import { PasswordReset } from '../entities/PasswordReset';

export interface PasswordResetRepository {
  create(reset: PasswordReset, trx?: GenericTransaction): Promise<void>;
  findByTokenHash(
    tokenHash: string,
    trx?: GenericTransaction,
  ): Promise<PasswordReset | null>;
  findLatestByAccountId(
    accountId: string,
    trx?: GenericTransaction,
  ): Promise<PasswordReset | null>;
  spendUnspentByAccountId(
    accountId: string,
    spentAt: Date,
    trx?: GenericTransaction,
  ): Promise<string[]>;
}
