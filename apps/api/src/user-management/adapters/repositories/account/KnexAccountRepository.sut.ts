import { getTestDbConnection } from '../../../../infra/testcontainers-setup';
import { Account } from '../../../domain/entities/Account';
import { ScryptPasswordHasher } from '../../services/password-hasher/ScryptPasswordHasher';
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
        termsAcceptedAt: context.testConstants.registeredAtForTest,
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

    async whenReadingAccountFor(email: string): Promise<Account | null> {
      return context.accountRepository.findByEmail(email);
    },

    async thenFoundAccountIsTheStoredOneFor(
      found: Account | null,
      email: string,
    ) {
      expect(found).not.toEqual(null);
      const rows = await context
        .testDbConnection<SchemaAccountRepository>('accounts')
        .where({ email });
      expect(rows).toHaveLength(1);
      expect(found?.id).toEqual(rows[0].id);
      expect(found?.email).toEqual(rows[0].email);
      expect(found?.passwordHash).toEqual(rows[0].password_hash);
    },

    thenNoAccountFound(found: Account | null) {
      expect(found).toEqual(null);
    },

    async thenTermsAcceptedAtIsWrittenFor(email: string, acceptedAt: Date) {
      const row = await context
        .testDbConnection<SchemaAccountRepository>('accounts')
        .where({ email })
        .first();
      expect(new Date(row?.terms_accepted_at ?? '')).toEqual(acceptedAt);
    },

    async thenAccountsTableHasOneRowFor(email: string) {
      const rows = await context
        .testDbConnection<SchemaAccountRepository>('accounts')
        .where({ email });
      expect(rows).toHaveLength(1);
    },
  };
};
