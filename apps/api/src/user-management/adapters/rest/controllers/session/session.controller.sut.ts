import { ModuleMetadata } from '@nestjs/common';
import { Either } from 'effect/index';

import { UnknownError } from '../../../../../shared/error/errors/UnknownError';
import { TestAuthState } from '../../../../../shared/test/http/TestAuthGuard';
import { UseCaseDouble } from '../../../../../shared/test/http/UseCaseDouble';
import { SignIn } from '../../../../domain/usecases/sign-in/SignIn';
import { InvalidCredentialsError } from '../../../../domain/usecases/sign-in/errors/InvalidCredentialsError';
import { SessionController } from './session.controller';

interface SignInInput {
  email: string;
  password: string;
  originKey: string;
  at: Date;
}

type SignInResult = Either.Either<
  { token: string; validUntil: Date },
  InvalidCredentialsError | UnknownError
>;

export const createSessionControllerSUT = () => {
  const signIn = new UseCaseDouble<SignInInput, SignInResult>();
  const authState: TestAuthState = { user: null };

  const metadata: ModuleMetadata = {
    controllers: [SessionController],
    providers: [{ provide: SignIn, useValue: signIn }],
  };

  return {
    metadata,
    signIn,
    authState,

    givenCredentialsAreRefused() {
      signIn.willResolve(Either.left(new InvalidCredentialsError()));
    },

    thenAttemptWasCountedForOrigin(notThisOrigin: string) {
      expect(signIn.calls).toHaveLength(1);
      const originKey = signIn.lastCall?.originKey;
      expect(typeof originKey).toEqual('string');
      expect(originKey).not.toEqual(notThisOrigin);
      expect(originKey).not.toEqual('');
    },
  };
};
