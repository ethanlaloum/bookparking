import { createReducer } from '@reduxjs/toolkit';

import { initialCommonState, type CommonState } from '../../../store/CommonState';
import type { Session } from '../domain/entities/Session';
import {
  resetSignInState,
  signInFailed,
  signInRequested,
  signInSucceeded,
} from '../domain/use-cases/sign-in/signInEpic';
import { logoutSucceeded } from '../domain/use-cases/sign-out/signOutEpic';

export interface AuthState {
  session: Session | null;
  signIn: CommonState;
}

const initialState: AuthState = {
  session: null,
  signIn: initialCommonState,
};

export const buildInitialAuthState = (session: Session | null): AuthState => ({
  ...initialState,
  session,
});

export const authReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(signInRequested, (state) => {
      state.signIn = { state: 'pending' };
    })
    .addCase(signInSucceeded, (state, action) => {
      state.signIn = { state: 'succeeded' };
      state.session = action.payload;
    })
    .addCase(signInFailed, (state, action) => {
      state.signIn = { state: 'failed', errorCode: action.payload.errorCode };
    })
    .addCase(resetSignInState, (state) => {
      state.signIn = initialCommonState;
    })
    .addCase(logoutSucceeded, () => initialState);
});
