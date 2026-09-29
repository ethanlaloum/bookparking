import { logoutRequested } from '../../../../auth/domain/use-cases/sign-out/signOutEpic';
import {
  selectMoneyWaitsForBankDetails,
  selectPayoutSummary,
  selectStripePageError,
} from '../../../../../selectors/payout/payoutSelectors';
import {
  aPayoutLine,
  buildInMemoryDependencies,
  type InMemoryDependencies,
} from '../../../../../store/testing/InMemoryDependencies';
import { createTestStore } from '../../../../../store/testing/createTestStore';
import type { PayoutSummary } from '../../entities/Payout';
import { stripePageRequested } from '../open-stripe-page/openStripePageEpic';
import { readPayoutsRequested } from './readPayoutsEpic';

export const createPayoutsSut = () => {
  const dependencies: InMemoryDependencies = buildInMemoryDependencies();
  const store = createTestStore(dependencies);

  return {
    aPayoutLine,

    givenTheApiHolds(summary: Partial<PayoutSummary>): void {
      dependencies.payoutGateway.summary = { ...dependencies.payoutGateway.summary, ...summary };
    },
    givenTheApiRejectsWith(message: string): void {
      dependencies.payoutGateway.rejection = message;
    },
    whenReading(): void {
      store.dispatch(readPayoutsRequested());
    },
    whenOpening(page: 'onboarding' | 'dashboard'): void {
      store.dispatch(stripePageRequested({ page }));
    },
    whenSigningOut(): void {
      store.dispatch(logoutRequested());
    },
    thenTheSummaryShownIs(expected: PayoutSummary | null): void {
      const actual = selectPayoutSummary(store.getState());
      if (JSON.stringify(actual) !== JSON.stringify(expected))
        throw new Error(`Résumé attendu ${JSON.stringify(expected)}, obtenu ${JSON.stringify(actual)}`);
    },
    thenTheStripePagesOpenedAre(urls: string[]): void {
      const actual = dependencies.paymentPageNavigator.opened;
      if (JSON.stringify(actual) !== JSON.stringify(urls))
        throw new Error(`Pages attendues ${urls.join(',')}, obtenues ${actual.join(',')}`);
    },
    thenTheStripeErrorShownIs(expected: string | null): void {
      const actual = selectStripePageError(store.getState());
      if (actual !== expected) throw new Error(`Erreur attendue ${String(expected)}, obtenue ${String(actual)}`);
    },
    thenMoneyWaitsForBankDetails(expected: boolean): void {
      const actual = selectMoneyWaitsForBankDetails(store.getState());
      if (actual !== expected) throw new Error(`Attente attendue ${String(expected)}, obtenue ${String(actual)}`);
    },
  };
};
