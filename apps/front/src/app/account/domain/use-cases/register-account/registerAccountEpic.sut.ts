import {
  buildInMemoryDependencies,
  type InMemoryDependencies,
} from '../../../../../store/testing/InMemoryDependencies';
import { createTestStore } from '../../../../../store/testing/createTestStore';
import { selectSession } from '../../../../../selectors/auth/authSelectors';
import { selectRegisterError } from '../../../../../selectors/account/accountSelectors';
import type { RegisterAccountPayload } from '../../ports/AccountGateway';
import { registerAccountRequested } from './registerAccountEpic';

export const createRegisterAccountSut = () => {
  const dependencies: InMemoryDependencies = buildInMemoryDependencies();
  const store = createTestStore(dependencies);

  return {
    givenTheApiRejectsWith(message: string): void {
      dependencies.accountGateway.rejection = message;
    },
    whenRegistering(payload: RegisterAccountPayload): void {
      store.dispatch(registerAccountRequested(payload));
    },
    thenTheUserIsSignedIn(): void {
      if (selectSession(store.getState()) === null)
        throw new Error('Aucune session ouverte apres inscription');
    },
    thenTheUserIsNotSignedIn(): void {
      if (selectSession(store.getState()) !== null)
        throw new Error('Une session a ete ouverte alors que l inscription a echoue');
    },
    thenTheCredentialsForwardedAre(email: string, password: string): void {
      const forwarded = dependencies.sessionGateway.received.at(-1);
      if (forwarded === undefined) throw new Error('Aucune connexion enchainee');
      if (forwarded.email !== email || forwarded.password !== password)
        throw new Error(`Identifiants enchaines inattendus : ${JSON.stringify(forwarded)}`);
    },
    thenTheErrorShownIs(expected: string): void {
      const actual = selectRegisterError(store.getState());
      if (actual !== expected)
        throw new Error(`Erreur attendue "${expected}", obtenue "${String(actual)}"`);
    },
  };
};
