import {
  moneyWaitsForBankDetails,
  type PayoutSummary,
} from '../../app/payout/domain/entities/Payout';
import type { AppState } from '../../store/AppState';

export const selectPayoutSummary = (state: AppState): PayoutSummary | null =>
  state.core.payout.summary;

export const selectPayoutsLoading = (state: AppState): boolean =>
  state.core.payout.read.state === 'pending' && state.core.payout.summary === null;

export const selectPayoutsError = (state: AppState): string | null =>
  state.core.payout.read.state === 'failed' ? (state.core.payout.read.errorCode ?? null) : null;

export const selectStripePagePending = (state: AppState): boolean =>
  state.core.payout.stripePage.state === 'pending';

export const selectStripePageError = (state: AppState): string | null =>
  state.core.payout.stripePage.state === 'failed'
    ? (state.core.payout.stripePage.errorCode ?? null)
    : null;

export const selectMoneyWaitsForBankDetails = (state: AppState): boolean =>
  moneyWaitsForBankDetails(state.core.payout.summary);
