import { Either } from 'effect/index';

import { UnknownError } from '../../../../shared/error/errors/UnknownError';
import { InMemoryAccountRepository } from '../../../adapters/repositories/account/InMemoryAccountRepository';
import { ScryptPasswordHasher } from '../../../adapters/services/password-hasher/ScryptPasswordHasher';
import { Account } from '../../entities/Account';
import { InvalidCredentialsError } from './errors/InvalidCredentialsError';
import { SignIn } from './SignIn';

interface SignInResult {
  token: string;
  validUntil: Date;
}

interface SignInInput {
  email: string;
  password: string;
  at: Date;
}

type SignInEither = Either.Either<
  SignInResult,
  InvalidCredentialsError | UnknownError
>;

export const createSignInSUT = () => {
  const accountRepository = new InMemoryAccountRepository();
  const passwordHasher = new ScryptPasswordHasher();

  const outboundPorts = { accountRepository, passwordHasher };

  const testConstants = {
    registeredAtForTest: new Date('2026-09-01T07:00:00.000Z'),
    atForTest: new Date('2026-10-01T07:00:00.000Z'),
  };

  const signIn = new SignIn(
    outboundPorts.accountRepository,
    outboundPorts.passwordHasher,
  );

  const context = {
    accountRepository,
    passwordHasher,
    outboundPorts,
    signIn,
    testConstants,
    signInResults: [] as SignInEither[],
  };

  return {
    context,

    async givenAccountFor(email: string, password: string): Promise<Account> {
      const account = Account.register({
        email,
        passwordHash: context.passwordHasher.hash(password),
        registeredAt: context.testConstants.registeredAtForTest,
      });
      await context.accountRepository.create(account);
      return account;
    },

    async whenSigningIn(
      overrides: Partial<SignInInput>,
    ): Promise<SignInEither> {
      const defaults: SignInInput = {
        email: '',
        password: '',
        at: context.testConstants.atForTest,
      };

      const result = await context.signIn.execute({
        ...defaults,
        ...overrides,
      });
      context.signInResults.push(result);
      return result;
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

    thenTokenIsValidUntil(result: SignInEither, validUntil: Date) {
      expect(Either.isRight(result)).toEqual(true);
      if (Either.isRight(result)) {
        expect(typeof result.right.token).toEqual('string');
        expect(result.right.token.length).toBeGreaterThan(0);
        expect(result.right.validUntil).toEqual(validUntil);
      }
    },

    thenNoTokenWasIssued() {
      expect(context.signInResults.length).toBeGreaterThan(0);
      expect(
        context.signInResults.every((result) => Either.isLeft(result)),
      ).toEqual(true);
    },

    thenBothRefusalsAreIndistinguishable(
      first: Either.Either<unknown, unknown>,
      second: Either.Either<unknown, unknown>,
    ) {
      expect(Either.isLeft(first)).toEqual(true);
      expect(Either.isLeft(second)).toEqual(true);
      if (!Either.isLeft(first) || !Either.isLeft(second)) return;

      const firstError = first.left as Error;
      const secondError = second.left as Error;

      expect(firstError.constructor).toBe(secondError.constructor);
      expect(firstError.message).toEqual(secondError.message);
      expect(Object.keys(firstError)).toEqual(Object.keys(secondError));
      expect(JSON.stringify(firstError)).toEqual(JSON.stringify(secondError));
    },
  };
};
