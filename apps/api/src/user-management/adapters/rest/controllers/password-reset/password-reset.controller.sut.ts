import { ModuleMetadata } from '@nestjs/common';
import { Either } from 'effect/index';

import { UnknownError } from '../../../../../shared/error/errors/UnknownError';
import { TestAuthState } from '../../../../../shared/test/http/TestAuthGuard';
import { UseCaseDouble } from '../../../../../shared/test/http/UseCaseDouble';
import { WeakPasswordError } from '../../../../domain/errors/WeakPasswordError';
import { RequestPasswordReset } from '../../../../domain/usecases/request-password-reset/RequestPasswordReset';
import { InvalidPasswordResetTokenError } from '../../../../domain/usecases/reset-password/errors/InvalidPasswordResetTokenError';
import { ResetPassword } from '../../../../domain/usecases/reset-password/ResetPassword';
import { PasswordResetController } from './password-reset.controller';

export const createPasswordResetControllerSUT = () => {
  const requestPasswordReset = new UseCaseDouble<
    { email: string; requestedAt: Date },
    Either.Either<void, UnknownError>
  >();
  const resetPassword = new UseCaseDouble<
    { token: string; newPassword: string; resetAt: Date },
    Either.Either<
      void,
      InvalidPasswordResetTokenError | WeakPasswordError | UnknownError
    >
  >();
  const authState: TestAuthState = { user: null };

  const metadata: ModuleMetadata = {
    controllers: [PasswordResetController],
    providers: [
      { provide: RequestPasswordReset, useValue: requestPasswordReset },
      { provide: ResetPassword, useValue: resetPassword },
    ],
  };

  return {
    metadata,
    authState,

    givenResetRequestsSucceed() {
      requestPasswordReset.willResolve(Either.right(undefined));
    },

    givenResetRequestsFail() {
      requestPasswordReset.willResolve(
        Either.left(new UnknownError('email outbox is unreachable')),
      );
    },

    givenResetsSucceed() {
      resetPassword.willResolve(Either.right(undefined));
    },

    givenResetsAreRefusedWith(
      error: InvalidPasswordResetTokenError | WeakPasswordError,
    ) {
      resetPassword.willResolve(Either.left(error));
    },

    thenResponseIs(
      response: { status: number; body: unknown },
      expected: { status: number; body: unknown },
    ) {
      expect({ status: response.status, body: response.body }).toEqual(
        expected,
      );
    },

    thenResetWasRequestedFor(emails: string[]) {
      expect(
        requestPasswordReset.calls.map((call) => ({
          email: call.email,
          requestedAtIsADate: call.requestedAt instanceof Date,
        })),
      ).toEqual(emails.map((email) => ({ email, requestedAtIsADate: true })));
    },

    thenPasswordWasResetWith(
      expected: { token: string; newPassword: string }[],
    ) {
      expect(
        resetPassword.calls.map((call) => ({
          token: call.token,
          newPassword: call.newPassword,
          resetAtIsADate: call.resetAt instanceof Date,
        })),
      ).toEqual(expected.map((call) => ({ ...call, resetAtIsADate: true })));
    },
  };
};
