import {
  selectRentalRequestsError,
  selectRequestsWaitingOverADay,
  selectSortedRentalRequests,
} from '../../../../../selectors/back-office/backOfficeSelectors';
import {
  anAdminRentalRequest,
  buildInMemoryDependencies,
  type InMemoryDependencies,
} from '../../../../../store/testing/InMemoryDependencies';
import { createTestStore } from '../../../../../store/testing/createTestStore';
import { isCancellable, type AdminRentalRequest } from '../../entities/AdminRentalRequest';
import { listRentalRequestsRequested } from './listRentalRequestsEpic';

export const createListRentalRequestsSut = () => {
  const dependencies: InMemoryDependencies = buildInMemoryDependencies();
  const store = createTestStore(dependencies);

  return {
    anAdminRentalRequest,

    givenTheApiHolds(requests: AdminRentalRequest[]): void {
      dependencies.backOfficeGateway.rentalRequests = requests;
    },
    givenTheApiRejectsWith(message: string): void {
      dependencies.backOfficeGateway.rejectWith('other', message);
    },
    whenListingRentalRequests(): void {
      store.dispatch(listRentalRequestsRequested());
    },
    thenTheRequestsShownAre(count: number): void {
      const actual = selectSortedRentalRequests(store.getState()).length;
      if (actual !== count) throw new Error(`Demandes attendues ${count}, obtenues ${actual}`);
    },
    thenTheFirstShownIs(id: string): void {
      const actual = selectSortedRentalRequests(store.getState())[0]?.id ?? null;
      if (actual !== id)
        throw new Error(`Première demande attendue "${id}", obtenue "${String(actual)}"`);
    },
    thenTheOnesWaitingOverADayAre(expected: number, now: Date): void {
      const actual = selectRequestsWaitingOverADay(store.getState(), now);
      if (actual !== expected)
        throw new Error(`Demandes en souffrance attendues ${expected}, obtenues ${actual}`);
    },
    thenTheCancellableOnesAre(expected: number): void {
      const actual = selectSortedRentalRequests(store.getState()).filter(isCancellable).length;
      if (actual !== expected)
        throw new Error(`Demandes annulables attendues ${expected}, obtenues ${actual}`);
    },
    thenTheErrorShownIs(expected: string): void {
      const actual = selectRentalRequestsError(store.getState());
      if (actual !== expected)
        throw new Error(`Erreur attendue "${expected}", obtenue "${String(actual)}"`);
    },
  };
};
