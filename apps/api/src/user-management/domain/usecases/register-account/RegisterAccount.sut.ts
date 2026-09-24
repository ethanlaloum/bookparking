import { Either } from 'effect/index';

import { InMemoryEmailOutbox } from '../../../../shared/email-outbox/adapters/repositories/InMemoryEmailOutbox';
import { InMemoryUnitOfWork } from '../../../../shared/unit-of-work/InMemoryUnitOfWork';
import { InMemoryAccountRepository } from '../../../adapters/repositories/account/InMemoryAccountRepository';
import { InMemoryHumanProof } from '../../../adapters/services/human-proof/InMemoryHumanProof';
import { HumanProofSolution } from '../../ports/HumanProof';
import { Account } from '../../entities/Account';
import { ScryptPasswordHasher } from '../../../adapters/services/password-hasher/ScryptPasswordHasher';
import { RegisterAccount } from './RegisterAccount';

interface RegistrationInput {
  email: string;
  password: string;
  registeredAt: Date;
  humanProof: HumanProofSolution;
  acceptsTerms: boolean;
}

// Une preuve de forme valide ; c'est `InMemoryHumanProof` qui décide si elle
// est acceptée.
export const HUMAN_PROOF_FOR_TEST: HumanProofSolution = {
  algorithm: 'SHA-256',
  challenge: 'challenge-for-test',
  salt: 'salt-for-test',
  number: 7,
  signature: 'signature-for-test',
};

export const createRegisterAccountSUT = () => {
  const accountRepository = new InMemoryAccountRepository();
  const emailOutbox = new InMemoryEmailOutbox();
  const unitOfWork = new InMemoryUnitOfWork();
  const humanProof = new InMemoryHumanProof();
  const passwordHasher = new ScryptPasswordHasher();

  const outboundPorts = {
    accountRepository,
    emailOutbox,
    unitOfWork,
    humanProof,
    passwordHasher,
  };

  const testConstants = {
    emailForTest: 'marc.d@example.com',
    passwordForTest: 'Barla2026!',
    registeredAtForTest: new Date('2026-10-01T07:00:00.000Z'),
  };

  const registerAccount = new RegisterAccount(
    outboundPorts.accountRepository,
    outboundPorts.emailOutbox,
    outboundPorts.unitOfWork,
    outboundPorts.humanProof,
    outboundPorts.passwordHasher,
  );

  const context = {
    accountRepository,
    emailOutbox,
    passwordHasher,
    outboundPorts,
    registerAccount,
    testConstants,
  };

  const storedAccountFor = (email: string): Account => {
    const accounts = context.accountRepository.accountList.filter((account) =>
      account.isIdentifiedBy(email),
    );
    expect(accounts).toHaveLength(1);
    return accounts[0];
  };

  return {
    context,

    givenNoAccountFor(email: string) {
      context.accountRepository.accountList =
        context.accountRepository.accountList.filter(
          (account) => !account.isIdentifiedBy(email),
        );
    },

    givenAccountRepositoryFailsToWrite() {
      context.accountRepository.enableFailureOnEveryWrite();
    },

    givenEveryHumanProofIsRejected() {
      humanProof.rejectEveryProof();
    },

    thenProofWasPresented(times: number) {
      expect(humanProof.presented).toHaveLength(times);
    },

    givenEmailOutboxFailsToWrite() {
      context.emailOutbox.enableFailureOnEveryWrite();
    },

    // Posé directement dans le dépôt, sans passer par l'inscription : un
    // compte existant n'a laissé aucun e-mail dans la file de ce test.
    givenExistingAccountFor(email: string) {
      context.accountRepository.accountList.push(
        Account.register({
          email,
          passwordHash: context.passwordHasher.hash(
            context.testConstants.passwordForTest,
          ),
          registeredAt: context.testConstants.registeredAtForTest,
          termsAcceptedAt: context.testConstants.registeredAtForTest,
        }),
      );
    },

    async whenRegistering(overrides?: Partial<RegistrationInput>) {
      const defaults: RegistrationInput = {
        email: context.testConstants.emailForTest,
        password: context.testConstants.passwordForTest,
        registeredAt: context.testConstants.registeredAtForTest,
        humanProof: HUMAN_PROOF_FOR_TEST,
        acceptsTerms: true,
      };

      return context.registerAccount.execute({ ...defaults, ...overrides });
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

    thenAccountExistsFor(email: string) {
      expect(storedAccountFor(email).email).toEqual(email);
    },

    thenStoredPasswordIsNot(email: string, plainTextPassword: string) {
      const storedPassword = storedAccountFor(email).passwordHash;
      expect(storedPassword).not.toEqual(plainTextPassword);
      expect(storedPassword.includes(plainTextPassword)).toEqual(false);
    },

    thenStoredPasswordVerifiesAgainst(
      email: string,
      plainTextPassword: string,
    ) {
      expect(
        context.passwordHasher.verify(
          plainTextPassword,
          storedAccountFor(email).passwordHash,
        ),
      ).toEqual(true);
    },

    thenWelcomeEmailQueuedFor(recipient: string, queuedAt: Date) {
      expect(
        context.emailOutbox.emails.map((email) => {
          const state = email.toState();
          return {
            kind: state.kind,
            recipient: state.recipient,
            status: state.status,
            queuedAt: state.queuedAt,
          };
        }),
      ).toEqual([{ kind: 'WELCOME', recipient, status: 'PENDING', queuedAt }]);
    },

    thenNothingQueuedContains(secret: string) {
      const queued = JSON.stringify(
        context.emailOutbox.emails.map((email) => email.toState()),
      );
      expect(queued.includes(secret)).toEqual(false);
    },

    thenNoEmailQueued() {
      expect(context.emailOutbox.emails).toEqual([]);
    },

    thenOnlyWelcomeEmailQueued() {
      expect(context.emailOutbox.emails.map((email) => email.kind)).toEqual([
        'WELCOME',
      ]);
    },

    thenAccountAcceptedTermsAt(email: string, acceptedAt: Date) {
      expect(storedAccountFor(email).toState().termsAcceptedAt).toEqual(
        acceptedAt,
      );
    },

    thenNoAccountCreated() {
      expect(context.accountRepository.accountList).toHaveLength(0);
    },

    async givenAccountFor(email: string, password: string): Promise<Account> {
      const result = await context.registerAccount.execute({
        email,
        password,
        registeredAt: context.testConstants.registeredAtForTest,
        humanProof: HUMAN_PROOF_FOR_TEST,
        acceptsTerms: true,
      });
      if (Either.isLeft(result)) {
        throw new Error('failed to arrange an existing account');
      }
      return result.right;
    },

    thenAccountIsUnchanged(existing: Account) {
      const stored = storedAccountFor(existing.email);
      expect(stored.toState()).toEqual(existing.toState());
    },

    thenOnlyOneAccountExistsFor(email: string) {
      storedAccountFor(email);
    },

    thenAccountIsImmediatelyUsableAsOwner(email: string) {
      const stored = storedAccountFor(email);
      expect(stored.id).toBeDefined();
      expect(stored.id).not.toEqual('');
      expect(Object.keys(stored.toState())).toEqual([
        'email',
        'passwordHash',
        'registeredAt',
        'termsAcceptedAt',
        'id',
        'suspendedAt',
      ]);
    },

    thenNoVerificationTokenWritten() {
      expect(Object.keys(context.outboundPorts)).toEqual([
        'accountRepository',
        'emailOutbox',
        'unitOfWork',
        'humanProof',
        'passwordHasher',
      ]);
    },
  };
};
