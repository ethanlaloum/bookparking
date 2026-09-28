import { logoutRequested } from '../../../../auth/domain/use-cases/sign-out/signOutEpic';
import { selectIsAuthenticated } from '../../../../../selectors/auth/authSelectors';
import {
  buildInMemoryDependencies,
  type InMemoryDependencies,
} from '../../../../../store/testing/InMemoryDependencies';
import { createTestStore } from '../../../../../store/testing/createTestStore';
import { signInRequested } from '../../../../auth/domain/use-cases/sign-in/signInEpic';
import { registerPushDeviceRequested } from './registerPushDeviceEpic';

export const createPushDeviceSut = () => {
  const dependencies: InMemoryDependencies = buildInMemoryDependencies();
  const store = createTestStore(dependencies);

  const same = (actual: string[], expected: string[], what: string): void => {
    if (JSON.stringify(actual) !== JSON.stringify(expected))
      throw new Error(`${what} attendus ${expected.join(',')}, obtenus ${actual.join(',')}`);
  };

  return {
    givenSignedIn(): void {
      store.dispatch(signInRequested({ email: 'marc.d@example.com', password: 'Barla2026!' }));
    },
    givenTheApiRejectsPhonesWith(message: string): void {
      dependencies.notificationGateway.pushDeviceRejection = message;
    },
    whenThePhoneHandsItsToken(token: string): void {
      store.dispatch(registerPushDeviceRequested({ token }));
    },
    whenSigningOut(): void {
      store.dispatch(logoutRequested());
    },
    thenTheApiRegistered(tokens: string[]): void {
      same(dependencies.notificationGateway.registeredPushDevices, tokens, 'Téléphones enregistrés');
    },
    thenTheApiForgot(tokens: string[]): void {
      same(dependencies.notificationGateway.forgottenPushDevices, tokens, 'Téléphones oubliés');
    },
    thenSignedOut(): void {
      if (selectIsAuthenticated(store.getState())) throw new Error('La session devrait être close');
    },
  };
};
