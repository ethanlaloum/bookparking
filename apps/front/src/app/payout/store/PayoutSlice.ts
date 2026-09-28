import { createReducer } from '@reduxjs/toolkit';

import { logoutSucceeded } from '../../auth/domain/use-cases/sign-out/signOutEpic';
import { initialCommonState, type CommonState } from '../../../store/CommonState';
import type { PayoutSummary } from '../domain/entities/Payout';
import {
  stripePageFailed,
  stripePageOpened,
  stripePageRequested,
} from '../domain/use-cases/open-stripe-page/openStripePageEpic';
import {
  readPayoutsFailed,
  readPayoutsRequested,
  readPayoutsSucceeded,
} from '../domain/use-cases/read-payouts/readPayoutsEpic';

export interface PayoutState {
  summary: PayoutSummary | null;
  read: CommonState;
  stripePage: CommonState;
}

const initialState: PayoutState = {
  summary: null,
  read: initialCommonState,
  stripePage: initialCommonState,
};

export const payoutReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(readPayoutsRequested, (state) => {
      state.read = { state: 'pending' };
    })
    .addCase(readPayoutsSucceeded, (state, action) => {
      state.read = { state: 'succeeded' };
      state.summary = action.payload;
    })
    .addCase(readPayoutsFailed, (state, action) => {
      state.read = { state: 'failed', errorCode: action.payload.errorCode };
    })
    .addCase(stripePageRequested, (state) => {
      state.stripePage = { state: 'pending' };
    })
    .addCase(stripePageOpened, (state) => {
      state.stripePage = { state: 'succeeded' };
    })
    .addCase(stripePageFailed, (state, action) => {
      state.stripePage = { state: 'failed', errorCode: action.payload.errorCode };
    })
    .addCase(logoutSucceeded, () => initialState);
});
