import {
  buildInMemoryDependencies,
  type InMemoryDependencies,
} from '../../../../../store/testing/InMemoryDependencies';
import { createTestStore } from '../../../../../store/testing/createTestStore';
import {
  selectRequestRentalError,
  selectRequestRentalSuccess,
} from '../../../../../selectors/rental/rentalSelectors';
import type { RequestedRental, RequestRentalPayload } from '../../ports/RentalGateway';
import { requestRentalRequested } from './requestRentalEpic';

export const createRequestRentalSut = () => {
  const dependencies: InMemoryDependencies = buildInMemoryDependencies();
  const store = createTestStore(dependencies);

  return {
    givenTheApiRejectsWith(message: string): void {
      dependencies.rentalGateway.rejection = message;
    },
    whenRequesting(payload: RequestRentalPayload): void {
      store.dispatch(
        requestRentalRequested({ ...payload, idempotencyKey: '9d3c1b2a-0f4e-4a5b-8c6d-7e8f9a0b1c2d' }),
      );
    },
    thenTheRequestSucceeded(): void {
      if (!selectRequestRentalSuccess(store.getState()))
        throw new Error('La demande n est pas marquee comme reussie');
    },
    givenTheApiOpensThePaymentPage(checkoutUrl: string): void {
      dependencies.rentalGateway.requestedRental = {
        id: '45fed099-ae81-4a57-b24e-7005a96cd4a0',
        checkoutUrl,
      };
    },
    // Ce que répond une api antérieure à SPEC-004 : 201, sans corps.
    givenTheApiAnswersWithoutBody(): void {
      dependencies.rentalGateway.requestedRental = undefined as unknown as RequestedRental;
    },
    thenThePaymentPagesOpenedAre(expected: string[]): void {
      const actual = dependencies.paymentPageNavigator.opened;
      if (JSON.stringify(actual) !== JSON.stringify(expected))
        throw new Error(`Pages ouvertes ${JSON.stringify(actual)}, attendues ${JSON.stringify(expected)}`);
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
