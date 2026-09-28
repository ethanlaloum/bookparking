import { PushDeviceRepository } from '../../../domain/ports/PushDeviceRepository';

export class InMemoryPushDeviceRepository implements PushDeviceRepository {
  public accountIdByToken = new Map<string, string>();
  private failing = false;

  public enableFailureOnEveryWrite(): void {
    this.failing = true;
  }

  public async register(token: string, accountId: string): Promise<void> {
    if (this.failing) throw new Error('push devices are unreachable');
    this.accountIdByToken.set(token, accountId);
  }

  public async forget(tokens: string[]): Promise<void> {
    if (this.failing) throw new Error('push devices are unreachable');
    for (const token of tokens) this.accountIdByToken.delete(token);
  }

  public tokensOf(accountId: string): string[] {
    return [...this.accountIdByToken]
      .filter(([, owner]) => owner === accountId)
      .map(([token]) => token);
  }
}
