import { ModuleMetadata } from '@nestjs/common';
import { Either } from 'effect/index';

import { UnknownError } from '../../../../../shared/error/errors/UnknownError';
import { TestAuthState } from '../../../../../shared/test/http/TestAuthGuard';
import { UseCaseDouble } from '../../../../../shared/test/http/UseCaseDouble';
import { Account } from '../../../../domain/entities/Account';
import { HumanChallenge } from '../../../../domain/ports/HumanProof';
import { ChangePassword } from '../../../../domain/usecases/change-password/ChangePassword';
import { IssueHumanChallenge } from '../../../../domain/usecases/issue-human-challenge/IssueHumanChallenge';
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
  const authState: TestAuthState = { user: null };

  const metadata: ModuleMetadata = {
    controllers: [AccountController],
    providers: [
      { provide: RegisterAccount, useValue: registerAccount },
      { provide: ChangePassword, useValue: changePassword },
      { provide: IssueHumanChallenge, useValue: issueHumanChallenge },
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
      });
      registerAccount.willResolve(Either.right(account));
      return { account };
    },

    thenAccountWasRegisteredFor(email: string) {
      expect(registerAccount.calls).toHaveLength(1);
      expect(registerAccount.lastCall?.email).toEqual(email);
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
