import {
  aRentalRequestView,
  buildInMemoryDependencies,
  type InMemoryDependencies,
} from '../../../../../store/testing/InMemoryDependencies';
import { createTestStore } from '../../../../../store/testing/createTestStore';
import {
  selectConfirmedRevenueInCents,
  selectReceivedRentalRequests,
  selectReceivedRentalRequestsError,
} from '../../../../../selectors/rental/rentalSelectors';
import type { RentalRequestView } from '../../entities/RentalRequestView';
import { confirmRentalRequestRequested } from '../confirm-rental-request/confirmRentalRequestEpic';
import { listReceivedRentalRequestsRequested } from './listReceivedRentalRequestsEpic';

export const createListReceivedRentalRequestsSut = () => {
  const dependencies: InMemoryDependencies = buildInMemoryDependencies();
  const store = createTestStore(dependencies);

  return {
    aRentalRequestView,

    givenTheApiHolds(requests: RentalRequestView[]): void {
      dependencies.rentalGateway.receivedRequests = requests;
    },
    givenTheApiRejectsWith(message: string): void {
      dependencies.rentalGateway.rejection = message;
    },
    whenListingReceivedRequests(): void {
      store.dispatch(listReceivedRentalRequestsRequested());
    },
    whenConfirming(requestId: string): void {
      store.dispatch(confirmRentalRequestRequested({ requestId }));
    },
    thenTheRequestsShownAre(count: number): void {
      const actual = selectReceivedRentalRequests(store.getState()).length;
      if (actual !== count) throw new Error(`Demandes attendues ${count}, obtenues ${actual}`);
    },
    thenTheRevenueInCentsIs(expected: number): void {
      const actual = selectConfirmedRevenueInCents(store.getState());
      if (actual !== expected)
        throw new Error(`Revenus attendus ${expected}, obtenus ${actual}`);
    },
    thenTheErrorShownIs(expected: string): void {
      const actual = selectReceivedRentalRequestsError(store.getState());
      if (actual !== expected)
        throw new Error(`Erreur attendue "${expected}", obtenue "${String(actual)}"`);
    },
    thenTheListWasRefetched(times: number): void {
      const actual = dependencies.rentalGateway.listReceivedCallCount;
      if (actual !== times) throw new Error(`Relectures attendues ${times}, obtenues ${actual}`);
    },
  };
};
