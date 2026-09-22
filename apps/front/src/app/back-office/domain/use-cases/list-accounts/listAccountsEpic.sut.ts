import {
  selectAccountsError,
  selectSortedAccounts,
  selectSuspendedAccountCount,
} from '../../../../../selectors/back-office/backOfficeSelectors';
import {
  anAdminAccount,
  buildInMemoryDependencies,
  type InMemoryDependencies,
} from '../../../../../store/testing/InMemoryDependencies';
import { createTestStore } from '../../../../../store/testing/createTestStore';
import type { AdminAccount } from '../../entities/AdminAccount';
import { listAccountsRequested } from './listAccountsEpic';

export const createListAccountsSut = () => {
  const dependencies: InMemoryDependencies = buildInMemoryDependencies();
  const store = createTestStore(dependencies);

  return {
    anAdminAccount,

    givenTheApiHolds(accounts: AdminAccount[]): void {
      dependencies.backOfficeGateway.accounts = accounts;
    },
    givenTheApiRejectsWith(message: string): void {
      dependencies.backOfficeGateway.rejectWith('other', message);
    },
    whenListingAccounts(): void {
      store.dispatch(listAccountsRequested());
    },
    thenTheAccountsShownAre(count: number): void {
      const actual = selectSortedAccounts(store.getState()).length;
      if (actual !== count) throw new Error(`Comptes attendus ${count}, obtenus ${actual}`);
    },
    thenTheFirstShownIs(email: string): void {
      const actual = selectSortedAccounts(store.getState())[0]?.email ?? null;
      if (actual !== email)
        throw new Error(`Premier compte attendu "${email}", obtenu "${String(actual)}"`);
    },
    thenTheSuspendedCountIs(expected: number): void {
      const actual = selectSuspendedAccountCount(store.getState());
      if (actual !== expected)
        throw new Error(`Comptes suspendus attendus ${expected}, obtenus ${actual}`);
    },
    thenTheErrorShownIs(expected: string): void {
      const actual = selectAccountsError(store.getState());
      if (actual !== expected)
        throw new Error(`Erreur attendue "${expected}", obtenue "${String(actual)}"`);
    },
  };
};
