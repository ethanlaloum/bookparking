import { Either } from 'effect/index';

import { UnknownError } from '../../../../shared/error/errors/UnknownError';
import { InMemoryAccountRepository } from '../../../adapters/repositories/account/InMemoryAccountRepository';
import { ScryptPasswordHasher } from '../../../adapters/services/password-hasher/ScryptPasswordHasher';
import { InMemorySignInFailureLog } from '../../../adapters/services/sign-in-failure-log/InMemorySignInFailureLog';
import { Account } from '../../entities/Account';
import { Delay } from '../../ports/Delay';
import { InvalidCredentialsError } from './errors/InvalidCredentialsError';
import { SignIn } from './SignIn';

interface SignInResult {
  token: string;
  validUntil: Date;
}

interface SignInInput {
  email: string;
  password: string;
  originKey: string;
  at: Date;
}

type SignInEither = Either.Either<
  SignInResult,
  InvalidCredentialsError | UnknownError
>;

class RecordingDelay implements Delay {
  public readonly waits: number[] = [];

  public wait(milliseconds: number): Promise<void> {
    this.waits.push(milliseconds);
    return Promise.resolve();
  }
}

export const ACCESS_TOKEN_SECRET_FOR_TEST =
  'secret-de-test-suffisamment-long-pour-signer';

export const ORIGIN_FOR_TEST = '203.0.113.7';

export const createSignInSUT = () => {
  const accountRepository = new InMemoryAccountRepository();
  const passwordHasher = new ScryptPasswordHasher();
  const failureLog = new InMemorySignInFailureLog();
  const delay = new RecordingDelay();

  const outboundPorts = {
    accountRepository,
    passwordHasher,
    failureLog,
    delay,
  };

  const testConstants = {
    registeredAtForTest: new Date('2026-09-01T07:00:00.000Z'),
    atForTest: new Date('2026-10-01T07:00:00.000Z'),
  };

  const signIn = new SignIn(
    outboundPorts.accountRepository,
    outboundPorts.passwordHasher,
    ACCESS_TOKEN_SECRET_FOR_TEST,
    outboundPorts.failureLog,
    outboundPorts.delay,
  );

  const context = {
    accountRepository,
    passwordHasher,
    failureLog,
    delay,
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
        termsAcceptedAt: context.testConstants.registeredAtForTest,
        avatar: 'SIGNAL',
      });
      await context.accountRepository.create(account);
      return account;
    },

    async givenSuspendedAccountFor(
      email: string,
      password: string,
    ): Promise<Account> {
      const account = Account.register({
        email,
        passwordHash: context.passwordHasher.hash(password),
        registeredAt: context.testConstants.registeredAtForTest,
        termsAcceptedAt: context.testConstants.registeredAtForTest,
        avatar: 'SIGNAL',
      });
      const suspended = Account.fromState({
        ...account.toState(),
        suspendedAt: new Date('2026-09-20T09:00:00.000Z'),
      });
      await context.accountRepository.create(suspended);
      return suspended;
    },

    async whenSigningIn(
      overrides: Partial<SignInInput>,
    ): Promise<SignInEither> {
      const defaults: SignInInput = {
        email: '',
        password: '',
        originKey: ORIGIN_FOR_TEST,
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

    thenLastAttemptWasDelayedBy(milliseconds: number) {
      expect(context.delay.waits.length).toBeGreaterThan(0);
      expect(context.delay.waits[context.delay.waits.length - 1]).toEqual(
        milliseconds,
      );
    },

    thenNoAttemptWasDelayed() {
      expect(context.delay.waits.every((wait) => wait === 0)).toEqual(true);
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

      expect(firstError.constructor).toEqual(secondError.constructor);
      expect(firstError.message).toEqual(secondError.message);
      expect(Object.keys(firstError)).toEqual(Object.keys(secondError));
      expect(JSON.stringify(firstError)).toEqual(JSON.stringify(secondError));
    },
  };
};
