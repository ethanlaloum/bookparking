import { Either } from 'effect/index';

import { InMemoryAccountRepository } from '../../../adapters/repositories/account/InMemoryAccountRepository';
import { Account } from '../../entities/Account';
import { ScryptPasswordHasher } from '../../../adapters/services/password-hasher/ScryptPasswordHasher';
import { RegisterAccount } from './RegisterAccount';

interface RegistrationInput {
  email: string;
  password: string;
  registeredAt: Date;
}

export const createRegisterAccountSUT = () => {
  const accountRepository = new InMemoryAccountRepository();
  const passwordHasher = new ScryptPasswordHasher();

  const outboundPorts = { accountRepository, passwordHasher };

  const testConstants = {
    emailForTest: 'marc.d@example.com',
    passwordForTest: 'Barla2026!',
    registeredAtForTest: new Date('2026-10-01T07:00:00.000Z'),
  };

  const registerAccount = new RegisterAccount(
    outboundPorts.accountRepository,
    outboundPorts.passwordHasher,
  );

  const context = {
    accountRepository,
    passwordHasher,
    outboundPorts,
    registerAccount,
    testConstants,
  };

  const storedAccountFor = (email: string): Account => {
    const accounts = context.accountRepository.accountList.filter((account) =>
      account.isIdentifiedBy(email),
    );
    expect(accounts).toHaveLength(1);
    return accounts[0];
  };

  return {
    context,

    givenNoAccountFor(email: string) {
      context.accountRepository.accountList =
        context.accountRepository.accountList.filter(
          (account) => !account.isIdentifiedBy(email),
        );
    },

    givenAccountRepositoryFailsToWrite() {
      context.accountRepository.enableFailureOnEveryWrite();
    },

    async whenRegistering(overrides?: Partial<RegistrationInput>) {
      const defaults: RegistrationInput = {
        email: context.testConstants.emailForTest,
        password: context.testConstants.passwordForTest,
        registeredAt: context.testConstants.registeredAtForTest,
      };

      return context.registerAccount.execute({ ...defaults, ...overrides });
    },

    thenResultIsRight(result: Either.Either<unknown, unknown>) {
      expect(Either.isRight(result)).toEqual(true);
    },

    thenResultIsLeftWithError(
      result: Either.Either<unknown, unknown>,
      ErrorClass: new (...args: never[]) => Error,
    ) {
      expect(Either.isLeft(result)).toEqual(true);
      if (Either.isLeft(result)) {
        expect(result.left).toBeInstanceOf(ErrorClass);
      }
    },

    thenAccountExistsFor(email: string) {
      expect(storedAccountFor(email).email).toEqual(email);
    },

    thenStoredPasswordIsNot(email: string, plainTextPassword: string) {
      const storedPassword = storedAccountFor(email).passwordHash;
      expect(storedPassword).not.toEqual(plainTextPassword);
      expect(storedPassword.includes(plainTextPassword)).toEqual(false);
    },

    thenStoredPasswordVerifiesAgainst(
      email: string,
      plainTextPassword: string,
    ) {
      expect(
        context.passwordHasher.verify(
          plainTextPassword,
          storedAccountFor(email).passwordHash,
        ),
      ).toEqual(true);
    },

    thenNoEmailSent() {
      expect(Object.keys(context.outboundPorts)).toEqual([
        'accountRepository',
        'passwordHasher',
      ]);
    },

    thenNoAccountCreated() {
      expect(context.accountRepository.accountList).toHaveLength(0);
    },
  };
};
