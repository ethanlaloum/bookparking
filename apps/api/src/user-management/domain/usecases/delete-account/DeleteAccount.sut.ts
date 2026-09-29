import { Either } from 'effect/index';

import { InMemoryEmailOutbox } from '../../../../shared/email-outbox/adapters/repositories/InMemoryEmailOutbox';
import { InMemoryUnitOfWork } from '../../../../shared/unit-of-work/InMemoryUnitOfWork';
import { InMemoryAccountFootprint } from '../../../adapters/repositories/account-footprint/InMemoryAccountFootprint';
import { InMemoryAccountRepository } from '../../../adapters/repositories/account/InMemoryAccountRepository';
import { InMemoryHumanProof } from '../../../adapters/services/human-proof/InMemoryHumanProof';
import { ScryptPasswordHasher } from '../../../adapters/services/password-hasher/ScryptPasswordHasher';
import { InMemorySignInFailureLog } from '../../../adapters/services/sign-in-failure-log/InMemorySignInFailureLog';
import { HUMAN_PROOF_FOR_TEST } from '../register-account/RegisterAccount.sut';
import { RegisterAccount } from '../register-account/RegisterAccount';
import {
  ACCESS_TOKEN_SECRET_FOR_TEST,
  ORIGIN_FOR_TEST,
} from '../sign-in/SignIn.sut';
import { SignIn } from '../sign-in/SignIn';
import { DeleteAccount } from './DeleteAccount';

export const DELETED_AT = new Date('2026-10-02T08:00:00.000Z');

export const createDeleteAccountSUT = () => {
  const accountRepository = new InMemoryAccountRepository();
  const accountFootprint = new InMemoryAccountFootprint();
  const passwordHasher = new ScryptPasswordHasher();
  const registerAccount = new RegisterAccount(
    accountRepository,
    new InMemoryEmailOutbox(),
    new InMemoryUnitOfWork(),
    new InMemoryHumanProof(),
    passwordHasher,
  );
  const signIn = new SignIn(
    accountRepository,
    passwordHasher,
    ACCESS_TOKEN_SECRET_FOR_TEST,
    new InMemorySignInFailureLog(),
    { wait: () => Promise.resolve() },
  );
  const deleteAccount = new DeleteAccount(
    accountRepository,
    accountFootprint,
    passwordHasher,
    new InMemoryUnitOfWork(),
  );

  const register = (email: string, password: string) =>
    registerAccount.execute({
      email,
      password,
      registeredAt: new Date('2026-09-01T00:00:00.000Z'),
      humanProof: HUMAN_PROOF_FOR_TEST,
      acceptsTerms: true,
      avatar: 'SIGNAL',
    });

  return {
    context: { accountRepository, accountFootprint },

    async givenAccountFor(email: string, password: string) {
      const created = await register(email, password);
      if (Either.isLeft(created))
        throw new Error('failed to arrange an existing account');
      return created.right;
    },

    givenOngoingCommitmentsFor(accountId: string) {
      accountFootprint.committedAccountIds.add(accountId);
    },

    givenAccountsAreUnreachable() {
      accountRepository.enableFailureOnEveryWrite();
    },

    whenDeleting(accountId: string, password: string) {
      return deleteAccount.execute({ accountId, password, at: DELETED_AT });
    },

    whenRegisteringAgain(email: string, password: string) {
      return register(email, password);
    },

    thenResultIsRight(result: Either.Either<unknown, unknown>) {
      expect(result).toEqual(Either.right(undefined));
    },

    thenResultIsLeftWith(
      result: Either.Either<unknown, unknown>,
      expected: { name: string; message: string },
    ) {
      expect(Either.isLeft(result)).toEqual(true);
      if (Either.isLeft(result))
        expect({
          name: (result.left as Error).constructor.name,
          message: (result.left as Error).message,
        }).toEqual(expected);
    },

    thenRegisteredAsNewAccount(
      result: Awaited<ReturnType<typeof register>>,
      expected: { email: string; not: string },
    ) {
      expect(Either.isRight(result)).toEqual(true);
      if (Either.isRight(result)) {
        expect(result.right.email).toEqual(expected.email);
        expect(result.right.id).not.toEqual(expected.not);
      }
    },

    thenStoredAccountsAre(emails: string[]) {
      expect(
        accountRepository.accountList.map((stored) => stored.email),
      ).toEqual(emails);
    },

    thenErasedFootprintsAre(expected: { accountId: string; email: string }[]) {
      expect(accountFootprint.erased).toEqual(expected);
    },

    thenCommitmentChecksAre(expected: { accountId: string; now: Date }[]) {
      expect(accountFootprint.commitmentChecks).toEqual(expected);
    },

    async thenSignInIsRefusedFor(email: string, password: string) {
      const attempt = await signIn.execute({
        email,
        password,
        originKey: ORIGIN_FOR_TEST,
        at: DELETED_AT,
      });
      expect(Either.isLeft(attempt)).toEqual(true);
    },
  };
};
