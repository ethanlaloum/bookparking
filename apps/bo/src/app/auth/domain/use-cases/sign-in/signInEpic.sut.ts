import type { Credentials } from '@front/app/auth/domain/ports/SessionGateway';

import {
  selectSession,
  selectSignInError,
  selectSignInRefusedAsNotAdmin,
} from '../../../../../selectors/authSelectors';
import {
  buildInMemoryDependencies,
  type InMemoryDependencies,
} from '../../../../../store/testing/InMemoryDependencies';
import { createTestStore } from '../../../../../store/testing/createTestStore';
import type { FailureKind } from '../../../../back-office/domain/ports/BackOfficeGateway';
import { signInRequested } from './signInEpic';

export const createSignInSut = () => {
  const dependencies: InMemoryDependencies = buildInMemoryDependencies();
  const store = createTestStore(dependencies);

  return {
    givenTheApiIssues(token: string, validUntil: string): void {
      dependencies.sessionGateway.session = { token, validUntil };
    },
    givenTheCredentialsAreRefusedWith(message: string): void {
      dependencies.sessionGateway.rejection = message;
    },
    givenTheAccessProbeFailsWith(kind: FailureKind, message: string): void {
      dependencies.backOfficeGateway.rejectWith(kind, message);
    },
    whenSigningIn(credentials: Credentials): void {
      store.dispatch(signInRequested(credentials));
    },
    thenTheOpenSessionIs(expected: { token: string; validUntil: string } | null): void {
      const actual = selectSession(store.getState());
      if (JSON.stringify(actual) !== JSON.stringify(expected))
        throw new Error(`Session attendue ${JSON.stringify(expected)}, obtenue ${JSON.stringify(actual)}`);
    },
    thenTheStoredSessionIs(expected: { token: string; validUntil: string } | null): void {
      const actual = dependencies.sessionStore.saved;
      if (JSON.stringify(actual) !== JSON.stringify(expected))
        throw new Error(`Stockage attendu ${JSON.stringify(expected)}, obtenu ${JSON.stringify(actual)}`);
    },
    thenTheAccessWasProbed(times: number): void {
      const actual = dependencies.backOfficeGateway.confirmAccessCallCount;
      if (actual !== times) throw new Error(`Sondes attendues ${times}, obtenues ${actual}`);
    },
    thenTheErrorShownIs(expected: string | null): void {
      const actual = selectSignInError(store.getState());
      if (actual !== expected)
        throw new Error(`Erreur attendue "${String(expected)}", obtenue "${String(actual)}"`);
    },
    thenTheRefusalIsForANonAdmin(expected: boolean): void {
      const actual = selectSignInRefusedAsNotAdmin(store.getState());
      if (actual !== expected)
        throw new Error(`Refus de non-administrateur attendu ${expected}, obtenu ${actual}`);
    },
  };
};
