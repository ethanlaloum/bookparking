import {
  selectAdminAccess,
  selectNeedsAttention,
  selectOverview,
  selectOverviewError,
} from '../../../../../selectors/back-office/backOfficeSelectors';
import {
  anOverview,
  buildInMemoryDependencies,
  type InMemoryDependencies,
} from '../../../../../store/testing/InMemoryDependencies';
import { createTestStore } from '../../../../../store/testing/createTestStore';
import type { Overview } from '../../entities/Overview';
import type { FailureKind } from '../../ports/BackOfficeGateway';
import { readOverviewRequested } from './readOverviewEpic';

export const createReadOverviewSut = () => {
  const dependencies: InMemoryDependencies = buildInMemoryDependencies();
  const store = createTestStore(dependencies);

  return {
    anOverview,

    givenTheApiHolds(overview: Overview): void {
      dependencies.backOfficeGateway.overview = overview;
    },
    givenTheApiRejectsWith(kind: FailureKind, message: string): void {
      dependencies.backOfficeGateway.rejectWith(kind, message);
    },
    whenReadingTheDashboard(): void {
      store.dispatch(readOverviewRequested());
    },
    thenTheRevenueShownInCentsIs(expected: number): void {
      const actual = selectOverview(store.getState())?.counts.confirmedRevenueInCents ?? null;
      if (actual !== expected)
        throw new Error(`Revenus attendus ${expected}, obtenus ${String(actual)}`);
    },
    thenTheAccessIs(expected: 'unknown' | 'granted' | 'denied'): void {
      const actual = selectAdminAccess(store.getState());
      if (actual !== expected) throw new Error(`Accès attendu ${expected}, obtenu ${actual}`);
    },
    thenTheBlockIsFlagged(expected: boolean): void {
      const actual = selectNeedsAttention(store.getState());
      if (actual !== expected)
        throw new Error(`Bloc « à surveiller » attendu ${String(expected)}, obtenu ${String(actual)}`);
    },
    thenTheErrorShownIs(expected: string): void {
      const actual = selectOverviewError(store.getState());
      if (actual !== expected)
        throw new Error(`Erreur attendue "${expected}", obtenue "${String(actual)}"`);
    },
    thenNothingIsShown(): void {
      if (selectOverview(store.getState()) !== null)
        throw new Error('Aucun tableau de bord ne devait être affiché');
    },
  };
};
