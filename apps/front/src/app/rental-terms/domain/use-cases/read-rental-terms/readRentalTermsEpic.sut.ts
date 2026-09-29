import { logoutRequested } from '../../../../auth/domain/use-cases/sign-out/signOutEpic';
import {
  selectRentalTerms,
  selectRentalTermsError,
} from '../../../../../selectors/rental-terms/rentalTermsSelectors';
import {
  buildInMemoryDependencies,
  type InMemoryDependencies,
} from '../../../../../store/testing/InMemoryDependencies';
import { createTestStore } from '../../../../../store/testing/createTestStore';
import type { RentalTerms } from '../../entities/RentalTerms';
import { readRentalTermsRequested } from './readRentalTermsEpic';

export const createReadRentalTermsSut = () => {
  const dependencies: InMemoryDependencies = buildInMemoryDependencies();
  const store = createTestStore(dependencies);

  return {
    givenTheApiHolds(terms: RentalTerms): void {
      dependencies.rentalTermsGateway.terms = terms;
    },
    givenTheApiRejectsWith(message: string): void {
      dependencies.rentalTermsGateway.rejection = message;
    },
    whenReading(): void {
      store.dispatch(readRentalTermsRequested());
    },
    whenSigningOut(): void {
      store.dispatch(logoutRequested());
    },
    thenTheTermsShownAre(expected: RentalTerms | null): void {
      const actual = selectRentalTerms(store.getState());
      if (JSON.stringify(actual) !== JSON.stringify(expected))
        throw new Error(`Conditions attendues ${JSON.stringify(expected)}, obtenues ${JSON.stringify(actual)}`);
    },
    thenTheErrorShownIs(expected: string | null): void {
      const actual = selectRentalTermsError(store.getState());
      if (actual !== expected)
        throw new Error(`Erreur attendue "${String(expected)}", obtenue "${String(actual)}"`);
    },
  };
};
