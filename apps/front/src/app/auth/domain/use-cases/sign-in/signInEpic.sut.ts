import {
  buildInMemoryDependencies,
  type InMemoryDependencies,
} from '../../../../../store/testing/InMemoryDependencies';
import { createTestStore } from '../../../../../store/testing/createTestStore';
import { selectSession, selectSignInError } from '../../../../../selectors/auth/authSelectors';
import type { Credentials } from '../../ports/SessionGateway';
import { signInRequested } from './signInEpic';

export const createSignInSut = () => {
  const dependencies: InMemoryDependencies = buildInMemoryDependencies();
  const store = createTestStore(dependencies);

  return {
    givenTheApiRejectsWith(message: string): void {
      dependencies.sessionGateway.rejection = message;
    },
    givenTheApiIssues(token: string, validUntil: string): void {
      dependencies.sessionGateway.session = { token, validUntil };
    },
    whenSigningIn(credentials: Credentials): void {
      store.dispatch(signInRequested(credentials));
    },
    thenTheSessionTokenIs(expected: string | null): void {
      const session = selectSession(store.getState());
      const actual = session === null ? null : session.token;
      if (actual !== expected)
        throw new Error(`Jeton attendu ${String(expected)}, obtenu ${String(actual)}`);
    },
    thenTheSessionIsPersisted(): void {
      if (dependencies.sessionStore.saved === null)
        throw new Error('La session n a pas ete ecrite dans le magasin');
    },
    thenNothingIsPersisted(): void {
      if (dependencies.sessionStore.saved !== null)
        throw new Error('Une session a ete ecrite alors que la connexion a echoue');
    },
    thenTheErrorShownIs(expected: string): void {
      const actual = selectSignInError(store.getState());
      if (actual !== expected)
        throw new Error(`Erreur attendue "${expected}", obtenue "${String(actual)}"`);
    },
    thenTheGatewaySawExactly(count: number): void {
      const actual = dependencies.sessionGateway.received.length;
      if (actual !== count) throw new Error(`Appels attendus ${count}, obtenus ${actual}`);
    },
  };
};
