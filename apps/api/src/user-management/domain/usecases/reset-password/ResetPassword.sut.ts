import { Either } from 'effect/index';

import { InMemoryUnitOfWork } from '../../../../shared/unit-of-work/InMemoryUnitOfWork';
import { InMemoryAccountRepository } from '../../../adapters/repositories/account/InMemoryAccountRepository';
import { InMemoryPasswordResetRepository } from '../../../adapters/repositories/password-reset/InMemoryPasswordResetRepository';
import { ScryptPasswordHasher } from '../../../adapters/services/password-hasher/ScryptPasswordHasher';
import { Account } from '../../entities/Account';
import { PasswordReset } from '../../entities/PasswordReset';
import { ResetPassword } from './ResetPassword';

export const createResetPasswordSUT = () => {
  const accountRepository = new InMemoryAccountRepository();
  const passwordResetRepository = new InMemoryPasswordResetRepository();
  const passwordHasher = new ScryptPasswordHasher();
  const resetPassword = new ResetPassword(
    accountRepository,
    passwordResetRepository,
    new InMemoryUnitOfWork(),
    passwordHasher,
  );

  const passwordHashOf = async (accountId: string): Promise<string> => {
    const account = await accountRepository.findById(accountId);
    if (account === null) throw new Error(`no account ${accountId}`);
    return account.passwordHash;
  };

  return {
    async givenAccount(params: {
      id: string;
      email: string;
      password: string;
    }) {
      await accountRepository.create(
        Account.fromState({
          id: params.id,
          email: params.email,
          passwordHash: passwordHasher.hash(params.password),
          registeredAt: new Date('2026-09-01T00:00:00.000Z'),
          termsAcceptedAt: new Date('2026-09-01T00:00:00.000Z'),
          avatar: 'SIGNAL',
          suspendedAt: null,
        }),
      );
    },

    async givenResetLink(params: {
      accountId: string;
      token: string;
      requestedAt: Date;
    }) {
      await passwordResetRepository.create(PasswordReset.issue(params));
    },

    whenResetting(params: { token: string; newPassword: string; at: Date }) {
      return resetPassword.execute({
        token: params.token,
        newPassword: params.newPassword,
        resetAt: params.at,
      });
    },

    thenResultIsRight(result: Either.Either<void, unknown>) {
      expect(Either.isRight(result)).toEqual(true);
      if (Either.isRight(result)) expect(result.right).toEqual(undefined);
    },

    thenResultIsLeftWith(
      result: Either.Either<unknown, unknown>,
      expected: Error,
    ) {
      expect(Either.isLeft(result)).toEqual(true);
      if (Either.isLeft(result)) {
        expect(result.left).toBeInstanceOf(expected.constructor);
        expect(result.left).toEqual(expected);
      }
    },

    async thenPasswordOf(
      accountId: string,
      expected: { accepts: string; refuses: string },
    ) {
      const hash = await passwordHashOf(accountId);
      expect({
        accepts: passwordHasher.verify(expected.accepts, hash),
        refuses: passwordHasher.verify(expected.refuses, hash),
      }).toEqual({ accepts: true, refuses: false });
    },

    thenResetsAre(
      expected: {
        tokenHash: string;
        accountId: string;
        requestedAt: Date;
        expiresAt: Date;
        spentAt: Date | null;
      }[],
    ) {
      expect(
        passwordResetRepository.resets.map((reset) => reset.toState()),
      ).toEqual(expected);
    },
  };
};
