import { PasswordReset } from '../../../domain/entities/PasswordReset';
import { PasswordResetRepository } from '../../../domain/ports/PasswordResetRepository';

export class InMemoryPasswordResetRepository implements PasswordResetRepository {
  public resets: PasswordReset[] = [];

  public async create(reset: PasswordReset): Promise<void> {
    this.resets.push(reset);
  }

  public async findByTokenHash(
    tokenHash: string,
  ): Promise<PasswordReset | null> {
    return this.resets.find((reset) => reset.tokenHash === tokenHash) ?? null;
  }

  public async findLatestByAccountId(
    accountId: string,
  ): Promise<PasswordReset | null> {
    const ofAccount = this.resets
      .filter((reset) => reset.accountId === accountId)
      .sort(
        (a, b) =>
          b.toState().requestedAt.getTime() - a.toState().requestedAt.getTime(),
      );
    return ofAccount[0] ?? null;
  }

  public async spendUnspentByAccountId(
    accountId: string,
    spentAt: Date,
  ): Promise<string[]> {
    const spent: string[] = [];
    this.resets = this.resets.map((reset) => {
      const state = reset.toState();
      if (state.accountId !== accountId || state.spentAt !== null) return reset;
      spent.push(state.tokenHash);
      return PasswordReset.fromState({ ...state, spentAt });
    });
    return spent;
  }
}
