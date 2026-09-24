import { Either } from 'effect/index';

import { InMemoryAccountRepository } from '../../../adapters/repositories/account/InMemoryAccountRepository';
import { Account, Avatar } from '../../entities/Account';
import { ReadOwnAccount } from './ReadOwnAccount';

interface ExpectedAccount {
  id: string;
  email: string;
  avatar: Avatar;
}

export const createReadOwnAccountSUT = () => {
  const accountRepository = new InMemoryAccountRepository();
  const readOwnAccount = new ReadOwnAccount(accountRepository);

  const context = { accountRepository, readOwnAccount };

  return {
    context,

    // Posé par `fromState()` : l'identifiant doit être celui de l'exemple, et
    // `register()` en tirerait un au hasard.
    givenAccount(account: ExpectedAccount) {
      context.accountRepository.accountList.push(
        Account.fromState({
          ...account,
          passwordHash: 'stub-password-hash',
          registeredAt: new Date('2026-10-01T07:00:00.000Z'),
          termsAcceptedAt: new Date('2026-10-01T07:00:00.000Z'),
          suspendedAt: null,
        }),
      );
    },

    async whenReading(accountId: string) {
      return context.readOwnAccount.execute({ accountId });
    },

    thenAccountReadIs(
      result: Either.Either<Account, unknown>,
      expected: ExpectedAccount,
    ) {
      expect(Either.isRight(result)).toEqual(true);
      if (Either.isRight(result))
        expect({
          id: result.right.id,
          email: result.right.email,
          avatar: result.right.avatar,
        }).toEqual(expected);
    },

    thenResultIsLeftWithError(
      result: Either.Either<unknown, unknown>,
      ErrorClass: new (...args: never[]) => Error,
    ) {
      expect(Either.isLeft(result)).toEqual(true);
      if (Either.isLeft(result)) expect(result.left).toBeInstanceOf(ErrorClass);
    },
  };
};
