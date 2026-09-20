import { getTestDbConnection } from '../../../../infra/testcontainers-setup';
import { Account } from '../../../domain/entities/Account';
import { ScryptPasswordHasher } from '../../../domain/services/ScryptPasswordHasher';
import { KnexAccountRepository } from './KnexAccountRepository';
import { SchemaAccountRepository } from './SchemaAccountRepository';

export const createKnexAccountRepositorySUT = () => {
  const testDbConnection = getTestDbConnection();
  const accountRepository = new KnexAccountRepository(testDbConnection);
  const passwordHasher = new ScryptPasswordHasher();

  const testConstants = {
    passwordForTest: 'correct-horse-battery',
    registeredAtForTest: new Date('2026-09-20T09:00:00.000Z'),
  };

  const context = {
    testDbConnection,
    accountRepository,
    passwordHasher,
    testConstants,
  };

  return {
    context,

    async whenWritingAccountFor(email: string): Promise<unknown> {
      const account = Account.register({
        email,
        passwordHash: context.passwordHasher.hash(
          context.testConstants.passwordForTest,
        ),
        registeredAt: context.testConstants.registeredAtForTest,
      });
      try {
        await context.accountRepository.create(account);
        return null;
      } catch (error: unknown) {
        return error;
      }
    },

    thenWriteSucceeded(outcome: unknown) {
      expect(outcome).toEqual(null);
    },

    thenWriteFailedWith(
      outcome: unknown,
      ErrorClass: new (...args: never[]) => Error,
    ) {
      expect(outcome).toBeInstanceOf(ErrorClass);
    },

    async thenAccountsTableHasOneRowFor(email: string) {
      const rows = await context
        .testDbConnection<SchemaAccountRepository>('accounts')
        .where({ email });
      expect(rows).toHaveLength(1);
    },
  };
};
