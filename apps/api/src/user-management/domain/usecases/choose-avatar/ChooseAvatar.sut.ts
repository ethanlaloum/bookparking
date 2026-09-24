import { Either } from 'effect/index';

import { InMemoryAccountRepository } from '../../../adapters/repositories/account/InMemoryAccountRepository';
import { Account, Avatar } from '../../entities/Account';
import { ChooseAvatar } from './ChooseAvatar';

export const createChooseAvatarSUT = () => {
  const accountRepository = new InMemoryAccountRepository();
  const chooseAvatar = new ChooseAvatar(accountRepository);

  const context = { accountRepository, chooseAvatar };

  const storedAvatarOf = (id: string): Avatar | undefined =>
    context.accountRepository.accountList.find((account) => account.id === id)
      ?.avatar;

  return {
    context,

    givenAccount(account: { id: string; email: string; avatar: Avatar }) {
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

    givenAccountRepositoryFails() {
      context.accountRepository.enableFailureOnEveryWrite();
    },

    async whenChoosing(accountId: string, avatar: Avatar) {
      return context.chooseAvatar.execute({ accountId, avatar });
    },

    thenResultIsRight(result: Either.Either<unknown, unknown>) {
      expect(Either.isRight(result)).toEqual(true);
    },

    thenResultIsLeftWithError(
      result: Either.Either<unknown, unknown>,
      ErrorClass: new (...args: never[]) => Error,
    ) {
      expect(Either.isLeft(result)).toEqual(true);
      if (Either.isLeft(result)) expect(result.left).toBeInstanceOf(ErrorClass);
    },

    thenAvatarOfIs(id: string, avatar: Avatar) {
      expect(storedAvatarOf(id)).toEqual(avatar);
    },
  };
};
