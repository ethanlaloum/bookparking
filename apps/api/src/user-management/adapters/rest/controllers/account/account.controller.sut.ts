import { ModuleMetadata } from '@nestjs/common';
import { Either } from 'effect/index';

import { UnknownError } from '../../../../../shared/error/errors/UnknownError';
import { TestAuthState } from '../../../../../shared/test/http/TestAuthGuard';
import { UseCaseDouble } from '../../../../../shared/test/http/UseCaseDouble';
import { Account, Avatar } from '../../../../domain/entities/Account';
import { HumanChallenge } from '../../../../domain/ports/HumanProof';
import { ChangePassword } from '../../../../domain/usecases/change-password/ChangePassword';
import { IssueHumanChallenge } from '../../../../domain/usecases/issue-human-challenge/IssueHumanChallenge';
import { ChooseAvatar } from '../../../../domain/usecases/choose-avatar/ChooseAvatar';
import { ReadOwnAccount } from '../../../../domain/usecases/read-own-account/ReadOwnAccount';
import { RegisterAccount } from '../../../../domain/usecases/register-account/RegisterAccount';
import { EmailAlreadyUsedError } from '../../../../domain/usecases/register-account/errors/EmailAlreadyUsedError';
import { AccountController } from './account.controller';

interface RegisterAccountInput {
  email: string;
  password: string;
  registeredAt: Date;
}

export const createAccountControllerSUT = () => {
  const registerAccount = new UseCaseDouble<
    RegisterAccountInput,
    Either.Either<Account, EmailAlreadyUsedError | UnknownError>
  >();
  const changePassword = new UseCaseDouble();
  const issueHumanChallenge = new UseCaseDouble<
    { now: Date },
    Either.Either<HumanChallenge, never>
  >();
  const readOwnAccount = new UseCaseDouble<
    { accountId: string },
    Either.Either<Account, UnknownError>
  >();
  const chooseAvatar = new UseCaseDouble<
    { accountId: string; avatar: Avatar },
    Either.Either<void, UnknownError>
  >();
  const authState: TestAuthState = { user: null };

  const metadata: ModuleMetadata = {
    controllers: [AccountController],
    providers: [
      { provide: RegisterAccount, useValue: registerAccount },
      { provide: ChangePassword, useValue: changePassword },
      { provide: IssueHumanChallenge, useValue: issueHumanChallenge },
      { provide: ReadOwnAccount, useValue: readOwnAccount },
      { provide: ChooseAvatar, useValue: chooseAvatar },
    ],
  };

  return {
    metadata,
    registerAccount,
    authState,

    givenAccountAlreadyExistsFor(email: string) {
      registerAccount.willResolve(Either.left(new EmailAlreadyUsedError()));
      return { email };
    },

    givenRegistrationSucceedsFor(email: string) {
      const account = Account.register({
        email,
        passwordHash: 'stub-password-hash',
        registeredAt: new Date(),
        termsAcceptedAt: new Date(),
        avatar: 'SIGNAL',
      });
      registerAccount.willResolve(Either.right(account));
      return { account };
    },

    thenAccountWasRegisteredFor(email: string) {
      expect(registerAccount.calls).toHaveLength(1);
      expect(registerAccount.lastCall?.email).toEqual(email);
    },

    givenSignedInAs(account: { id: string; email: string; avatar: Avatar }) {
      authState.user = { id: account.id };
      readOwnAccount.willResolve(
        Either.right(
          Account.fromState({
            ...account,
            passwordHash: 'stub-password-hash',
            registeredAt: new Date('2026-10-01T07:00:00.000Z'),
            termsAcceptedAt: new Date('2026-10-01T07:00:00.000Z'),
            suspendedAt: null,
          }),
        ),
      );
    },

    givenAvatarChangeSucceeds() {
      chooseAvatar.willResolve(Either.right(undefined));
    },

    thenAvatarWasChosen(accountId: string, avatar: Avatar) {
      expect(chooseAvatar.calls).toEqual([{ accountId, avatar }]);
    },

    thenNoAvatarWasChosen() {
      expect(chooseAvatar.calls).toHaveLength(0);
    },

    thenAccountWasReadFor(accountId: string) {
      expect(readOwnAccount.calls).toEqual([{ accountId }]);
    },

    thenNoAccountWasRead() {
      expect(readOwnAccount.calls).toHaveLength(0);
    },

    thenAccountWasRegisteredWithAvatar(avatar: Avatar) {
      expect(registerAccount.lastCall).toMatchObject({ avatar });
    },

    givenChallenge(challenge: HumanChallenge) {
      issueHumanChallenge.willResolve(Either.right(challenge));
    },

    thenNoAccountWasRegistered() {
      expect(registerAccount.calls).toHaveLength(0);
    },
    thenNoPasswordWasChanged() {
      expect(changePassword.calls).toHaveLength(0);
    },
  };
};
