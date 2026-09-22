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

export interface AccountState {
  account: Account | null;
  register: CommonState;
  changePassword: CommonState;
}

const initialState: AccountState = {
  account: null,
  register: initialCommonState,
  changePassword: initialCommonState,
};

export const accountReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(registerAccountRequested, (state) => {
      state.register = { state: 'pending' };
    })
    .addCase(registerAccountSucceeded, (state, action) => {
      state.register = { state: 'succeeded' };
      state.account = action.payload;
    })
    .addCase(registerAccountFailed, (state, action) => {
      state.register = { state: 'failed', errorCode: action.payload.errorCode };
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
