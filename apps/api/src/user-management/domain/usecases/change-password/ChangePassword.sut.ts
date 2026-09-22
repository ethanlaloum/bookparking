import { Either } from 'effect/index';

import { InMemoryAccountRepository } from '../../../adapters/repositories/account/InMemoryAccountRepository';
import { ScryptPasswordHasher } from '../../../adapters/services/password-hasher/ScryptPasswordHasher';
import { slidingAccessToken } from '../../services/slidingAccessToken';
import { RegisterAccount } from '../register-account/RegisterAccount';
import { ACCESS_TOKEN_SECRET_FOR_TEST } from '../sign-in/SignIn.sut';
import { SignIn } from '../sign-in/SignIn';
import { ChangePassword } from './ChangePassword';

export const createChangePasswordSUT = () => {
  const accountRepository = new InMemoryAccountRepository();
  const passwordHasher = new ScryptPasswordHasher();
  const registerAccount = new RegisterAccount(
    accountRepository,
    passwordHasher,
  );
  const signIn = new SignIn(
    accountRepository,
    passwordHasher,
    ACCESS_TOKEN_SECRET_FOR_TEST,
  );
  const changePassword = new ChangePassword(accountRepository, passwordHasher);

  const context = { accountRepository, passwordHasher, signIn, changePassword };

  return {
    context,

    async givenAccountFor(email: string, password: string) {
      const created = await registerAccount.execute({
        email,
        password,
        registeredAt: new Date('2026-09-01T00:00:00.000Z'),
      });
      if (Either.isLeft(created))
        throw new Error('failed to arrange an existing account');
      return created.right;
    },

    async givenTokenIssuedAt(email: string, password: string, at: Date) {
      const signedIn = await context.signIn.execute({ email, password, at });
      if (Either.isLeft(signedIn))
        throw new Error('failed to arrange an issued token');
      return signedIn.right.token;
    },

    async whenChangingPassword(props: {
      email: string;
      currentPassword: string;
      newPassword: string;
    }) {
      const account = await accountRepository.findByEmail(props.email);
      return context.changePassword.execute({
        accountId: account?.id ?? 'unknown-account',
        currentPassword: props.currentPassword,
        newPassword: props.newPassword,
      });
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

    async thenSignInSucceedsWith(email: string, password: string) {
      const attempt = await context.signIn.execute({
        email,
        password,
        at: new Date('2026-10-02T08:00:00.000Z'),
      });
      expect(Either.isRight(attempt)).toEqual(true);
    },

    async thenSignInFailsWith(email: string, password: string) {
      const attempt = await context.signIn.execute({
        email,
        password,
        at: new Date('2026-10-02T08:00:00.000Z'),
      });
      expect(Either.isLeft(attempt)).toEqual(true);
    },

    thenTokenIsStillAccepted(token: string, presentedAt: Date) {
      expect(
        slidingAccessToken(token, presentedAt, ACCESS_TOKEN_SECRET_FOR_TEST),
      ).not.toEqual(null);
    },
  };
};
