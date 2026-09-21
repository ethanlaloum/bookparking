import { GenericTransaction } from '../../../shared/unit-of-work/GenericTransaction';
import { Account } from '../entities/Account';

export interface AccountRepository {
  create(account: Account, trx?: GenericTransaction): Promise<void>;
}
