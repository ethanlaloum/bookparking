import { createReducer } from '@reduxjs/toolkit';

import { logoutSucceeded } from '../../auth/domain/use-cases/sign-out/signOutEpic';
import { initialCommonState, type CommonState } from '../../../store/CommonState';
import {
  changePasswordFailed,
  changePasswordRequested,
  changePasswordSucceeded,
  resetChangePasswordState,
} from '../domain/use-cases/change-password/changePasswordEpic';
import {
  registerAccountFailed,
  registerAccountRequested,
  registerAccountSucceeded,
  resetRegisterAccountState,
} from '../domain/use-cases/register-account/registerAccountEpic';
import type { Account } from '../domain/entities/Account';
import type { HumanProof } from '../domain/entities/HumanProof';
import {
  humanProofFailed,
  humanProofRequested,
  humanProofSolved,
} from '../domain/use-cases/human-proof/humanProofEpic';

export interface AccountState {
  account: Account | null;
  register: CommonState;
  changePassword: CommonState;
  humanProof: CommonState;
  proof: HumanProof | null;
}

const initialState: AccountState = {
  account: null,
  register: initialCommonState,
  changePassword: initialCommonState,
  humanProof: initialCommonState,
  proof: null,
};

export const accountReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(registerAccountRequested, (state) => {
      state.register = { state: 'pending' };
      // Présentée à l'api, la preuve est dépensée.
      state.proof = null;
      state.humanProof = initialCommonState;
    })
    .addCase(humanProofRequested, (state) => {
      state.humanProof = { state: 'pending' };
      state.proof = null;
    })
    .addCase(registerAccountFailed, (state, action) => {
      state.register = { state: 'failed', errorCode: action.payload.errorCode };
      state.humanProof = { state: 'pending' };
    })
    .addCase(humanProofSolved, (state, action) => {
      state.humanProof = { state: 'succeeded' };
      state.proof = action.payload;
    })
    .addCase(humanProofFailed, (state, action) => {
      state.humanProof = { state: 'failed', errorCode: action.payload.errorCode };
    })
    .addCase(registerAccountSucceeded, (state, action) => {
      state.register = { state: 'succeeded' };
      state.account = action.payload;
    })
    .addCase(resetRegisterAccountState, (state) => {
      state.register = initialCommonState;
    })
    .addCase(changePasswordRequested, (state) => {
      state.changePassword = { state: 'pending' };
    })
    .addCase(changePasswordSucceeded, (state) => {
      state.changePassword = { state: 'succeeded' };
    })
    .addCase(changePasswordFailed, (state, action) => {
      state.changePassword = { state: 'failed', errorCode: action.payload.errorCode };
    })
    .addCase(resetChangePasswordState, (state) => {
      state.changePassword = initialCommonState;
    })
    .addCase(logoutSucceeded, () => initialState);
});
