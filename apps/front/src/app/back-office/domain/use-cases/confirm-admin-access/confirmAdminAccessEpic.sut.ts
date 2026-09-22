import { selectAdminAccess } from '../../../../../selectors/back-office/backOfficeSelectors';
import {
  buildInMemoryDependencies,
  type InMemoryDependencies,
} from '../../../../../store/testing/InMemoryDependencies';
import { createTestStore } from '../../../../../store/testing/createTestStore';
import type { FailureKind } from '../../ports/BackOfficeGateway';
import { confirmAdminAccessRequested } from './confirmAdminAccessEpic';

export const createConfirmAdminAccessSut = () => {
  const dependencies: InMemoryDependencies = buildInMemoryDependencies();
  const store = createTestStore(dependencies);

  return {
    givenTheApiRefusesWith(kind: FailureKind, message: string): void {
      dependencies.backOfficeGateway.rejectWith(kind, message);
    },
    whenTheDashboardAsks(): void {
      store.dispatch(confirmAdminAccessRequested());
    },
    thenTheAccessIs(expected: 'unknown' | 'granted' | 'denied'): void {
      const actual = selectAdminAccess(store.getState());
      if (actual !== expected) throw new Error(`Accès attendu ${expected}, obtenu ${actual}`);
    },
    thenTheDashboardWasNotRead(): void {
      const reads = dependencies.backOfficeGateway.readOverviewCallCount;
      if (reads !== 0)
        throw new Error(`La sonde ne doit rien lire d'autre, ${reads} lecture(s) du tableau`);
    },
  };
};
