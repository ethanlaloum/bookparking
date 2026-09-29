import {
  buildInMemoryDependencies,
  type InMemoryDependencies,
} from '../../../../../store/testing/InMemoryDependencies';
import { createTestStore } from '../../../../../store/testing/createTestStore';
import {
  selectLastRequestedRental,
  selectRequestRentalError,
  selectRequestRentalSuccess,
} from '../../../../../selectors/rental/rentalSelectors';
import type { RequestRentalPayload } from '../../ports/RentalGateway';
import { requestRentalRequested } from './requestRentalEpic';

export const createRequestRentalSut = () => {
  const dependencies: InMemoryDependencies = buildInMemoryDependencies();
  const store = createTestStore(dependencies);

  return {
    givenTheApiRejectsWith(message: string): void {
      dependencies.rentalGateway.rejection = message;
    },
    whenRequesting(payload: RequestRentalPayload): void {
      store.dispatch(requestRentalRequested(payload));
    },
    thenTheRequestSucceeded(): void {
      if (!selectRequestRentalSuccess(store.getState()))
        throw new Error('La demande n est pas marquee comme reussie');
    },
    thenTheSubmittedPeriodIsKept(fromDay: string, toDay: string): void {
      const kept = selectLastRequestedRental(store.getState());
      if (kept === null) throw new Error('Aucune demande conservee');
      if (kept.fromDay !== fromDay || kept.toDay !== toDay)
        throw new Error(`Periode conservee inattendue : ${JSON.stringify(kept)}`);
    },
    thenTheErrorShownIs(expected: string): void {
      const actual = selectRequestRentalError(store.getState());
      if (actual !== expected)
        throw new Error(`Erreur attendue "${expected}", obtenue "${String(actual)}"`);
    },
    thenTheGatewaySawExactly(count: number): void {
      const actual = dependencies.rentalGateway.requested.length;
      if (actual !== count) throw new Error(`Appels attendus ${count}, obtenus ${actual}`);
    },
  };
};
