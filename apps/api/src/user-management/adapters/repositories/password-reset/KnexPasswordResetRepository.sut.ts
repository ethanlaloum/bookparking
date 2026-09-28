import { getTestDbConnection } from '../../../../infra/testcontainers-setup';
import { Account } from '../../../domain/entities/Account';
import { PasswordReset } from '../../../domain/entities/PasswordReset';
import { KnexAccountRepository } from '../account/KnexAccountRepository';
import { KnexPasswordResetRepository } from './KnexPasswordResetRepository';
import { SchemaPasswordResetRepository } from './SchemaPasswordResetRepository';

const TABLE = 'password_resets';

export const createKnexPasswordResetRepositorySUT = () => {
  const testDbConnection = getTestDbConnection();
  const passwordResetRepository = new KnexPasswordResetRepository(
    testDbConnection,
  );
  const accountRepository = new KnexAccountRepository(testDbConnection);

  const rows = async () =>
    (
      await testDbConnection<SchemaPasswordResetRepository>(TABLE).orderBy(
        'requested_at',
      )
    ).map((row) => ({
      token_hash: row.token_hash,
      account_id: row.account_id,
      requested_at: new Date(row.requested_at),
      expires_at: new Date(row.expires_at),
      spent_at: row.spent_at === null ? null : new Date(row.spent_at),
    }));

  return {
    async givenAccount(id: string, email: string) {
      await accountRepository.create(
        Account.fromState({
          id,
          email,
          passwordHash: 'stub-password-hash',
          registeredAt: new Date('2026-09-01T00:00:00.000Z'),
          termsAcceptedAt: new Date('2026-09-01T00:00:00.000Z'),
          avatar: 'SIGNAL',
          suspendedAt: null,
        }),
      );
    },

    async givenReset(params: {
      accountId: string;
      token: string;
      requestedAt: string;
      spentAt?: string;
    }) {
      const issued = PasswordReset.issue({
        accountId: params.accountId,
        token: params.token,
        requestedAt: new Date(params.requestedAt),
      });
      await passwordResetRepository.create(
        params.spentAt === undefined
          ? issued
          : PasswordReset.fromState({
              ...issued.toState(),
              spentAt: new Date(params.spentAt),
            }),
      );
    },

    whenReadingByToken(token: string) {
      return passwordResetRepository.findByTokenHash(
        PasswordReset.hashOf(token),
      );
    },

    whenReadingLatestOf(accountId: string) {
      return passwordResetRepository.findLatestByAccountId(accountId);
    },

    whenSpendingUnspentOf(accountId: string, spentAt: string) {
      return passwordResetRepository.spendUnspentByAccountId(
        accountId,
        new Date(spentAt),
      );
    },

    thenSpentHashesAre(outcomes: string[][], expected: string[][]) {
      expect(outcomes).toEqual(expected);
    },

    thenResetIs(reset: PasswordReset | null, expected: unknown) {
      expect(reset === null ? null : reset.toState()).toEqual(expected);
    },

    async thenRowsAre(expected: unknown[]) {
      expect(await rows()).toEqual(expected);
    },

    async thenNoRowHolds(token: string) {
      const raw = JSON.stringify(
        await testDbConnection<SchemaPasswordResetRepository>(TABLE),
      );
      expect(raw.includes(token)).toEqual(false);
    },

    async thenRowsAreGoneWithTheAccount(accountId: string) {
      await testDbConnection('accounts').where({ id: accountId }).delete();
      expect(await rows()).toEqual([]);
    },
  };
};
