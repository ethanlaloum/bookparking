import { AccountFootprint } from '../../../domain/ports/AccountFootprint';

export class InMemoryAccountFootprint implements AccountFootprint {
  public readonly committedAccountIds = new Set<string>();
  public readonly commitmentChecks: { accountId: string; now: Date }[] = [];
  public readonly erased: { accountId: string; email: string }[] = [];

  public async hasOngoingCommitments(
    accountId: string,
    now: Date,
  ): Promise<boolean> {
    this.commitmentChecks.push({ accountId, now });
    return this.committedAccountIds.has(accountId);
  }

  public async erase(accountId: string, email: string): Promise<void> {
    this.erased.push({ accountId, email });
  }
}
