import { Account } from '../../../domain/entities/Account';
import { AccountRepository } from '../../../domain/ports/AccountRepository';
import { EmailAlreadyUsedError } from '../../../domain/usecases/register-account/errors/EmailAlreadyUsedError';

export class InMemoryAccountRepository implements AccountRepository {
  public accountList: Account[] = [];
  private failing = false;

  public enableFailureOnEveryWrite(): void {
    this.failing = true;
  }

  public disableFailureOnEveryWrite(): void {
    this.failing = false;
  }

  public async create(account: Account): Promise<void> {
    if (this.failing) throw new Error('accounts repository is unreachable');
    if (this.accountList.some((stored) => stored.isIdentifiedBy(account.email)))
      throw new EmailAlreadyUsedError();
    this.accountList.push(account);
  }
}
