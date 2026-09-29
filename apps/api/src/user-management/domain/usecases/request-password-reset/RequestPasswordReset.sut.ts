import { Either } from 'effect/index';

import { InMemoryEmailOutbox } from '../../../../shared/email-outbox/adapters/repositories/InMemoryEmailOutbox';
import { InMemoryUnitOfWork } from '../../../../shared/unit-of-work/InMemoryUnitOfWork';
import { InMemoryAccountRepository } from '../../../adapters/repositories/account/InMemoryAccountRepository';
import { InMemoryPasswordResetRepository } from '../../../adapters/repositories/password-reset/InMemoryPasswordResetRepository';
import { Account } from '../../entities/Account';
import { RequestPasswordReset } from './RequestPasswordReset';

export const createRequestPasswordResetSUT = () => {
  const accountRepository = new InMemoryAccountRepository();
  const passwordResetRepository = new InMemoryPasswordResetRepository();
  const emailOutbox = new InMemoryEmailOutbox();
  const drawnTokens = ['token-1', 'token-2'];
  let draws = 0;
  const requestPasswordReset = new RequestPasswordReset(
    accountRepository,
    passwordResetRepository,
    emailOutbox,
    new InMemoryUnitOfWork(),
    () => drawnTokens[draws++],
  );

  return {
    async givenAccount(params: {
      id: string;
      email: string;
      suspendedAt?: Date;
    }) {
      await accountRepository.create(
        Account.fromState({
          id: params.id,
          email: params.email,
          passwordHash: 'stub-password-hash',
          registeredAt: new Date('2026-09-01T00:00:00.000Z'),
          termsAcceptedAt: new Date('2026-09-01T00:00:00.000Z'),
          avatar: 'SIGNAL',
          suspendedAt: params.suspendedAt ?? null,
        }),
      );
    },

    givenOutboxIsUnreachable() {
      emailOutbox.enableFailureOnEveryWrite();
    },

    whenRequestingReset(email: string, requestedAt: Date) {
      return requestPasswordReset.execute({ email, requestedAt });
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

    thenQueuedEmailsAre(
      expected: {
        kind: string;
        recipient: string;
        status: string;
        attempts: number;
        queuedAt: Date;
        sentAt: Date | null;
        failedAt: Date | null;
        passwordResetToken: string | null;
      }[],
    ) {
      expect(
        emailOutbox.emails.map((email) => {
          const { id: _id, ...state } = email.toState();
          return state;
        }),
      ).toEqual(expected);
    },
  };
};
