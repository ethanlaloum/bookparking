import { selectIsAuthenticated } from '../../../../../selectors/auth/authSelectors';
import {
  buildInMemoryDependencies,
  type InMemoryDependencies,
} from '../../../../../store/testing/InMemoryDependencies';
import { createTestStore } from '../../../../../store/testing/createTestStore';
import type { FailureKind } from '../../../../back-office/domain/ports/BackOfficeGateway';
import { readOverviewRequested } from '../../../../back-office/domain/use-cases/read-overview/readOverviewEpic';
import { listAccountsRequested } from '../../../../back-office/domain/use-cases/list-accounts/listAccountsEpic';
import { signInRequested } from '../sign-in/signInEpic';

export const createDropExpiredSessionSut = () => {
  const dependencies: InMemoryDependencies = buildInMemoryDependencies();
  const store = createTestStore(dependencies);

  return {
    givenAnOpenSession(): void {
      store.dispatch(signInRequested({ email: 'admin@bookparking.fr', password: 'motdepasse' }));
    },
    givenTheApiRejectsEveryReadWith(kind: FailureKind, message: string): void {
      dependencies.backOfficeGateway.rejectWith(kind, message);
    },
    whenTheDashboardReadsTwice(): void {
      store.dispatch(readOverviewRequested());
      store.dispatch(listAccountsRequested());
    },
    thenTheAdminIsSignedOut(): void {
      if (selectIsAuthenticated(store.getState()))
        throw new Error("La session devait être fermée");
    },
    thenTheAdminIsStillSignedIn(): void {
      if (!selectIsAuthenticated(store.getState()))
        throw new Error('La session devait rester ouverte');
    },
    thenTheStoredSessionWasCleared(): void {
      if (!dependencies.sessionStore.cleared)
        throw new Error('Le stockage devait être vidé');
    },
  };
};
