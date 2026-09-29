import { createReducer } from '@reduxjs/toolkit';

import type { Session } from '@front/app/auth/domain/entities/Session';
import { initialCommonState, type CommonState } from '@front/store/CommonState';

import type { FailureKind } from '../../back-office/domain/ports/BackOfficeGateway';
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
  signInFailureKind: FailureKind | null;
}

const initialState: AuthState = {
  session: null,
  signIn: initialCommonState,
  signInFailureKind: null,
};

export const buildInitialAuthState = (session: Session | null): AuthState => ({
  ...initialState,
  session,
});

export const authReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(signInRequested, (state) => {
      state.signIn = { state: 'pending' };
      state.signInFailureKind = null;
    })
    .addCase(signInSucceeded, (state, action) => {
      state.signIn = { state: 'succeeded' };
      state.session = action.payload;
    })
    .addCase(signInFailed, (state, action) => {
      state.signIn = { state: 'failed', errorCode: action.payload.errorCode };
      state.signInFailureKind = action.payload.kind;
    })
    .addCase(resetSignInState, (state) => {
      state.signIn = initialCommonState;
      state.signInFailureKind = null;
    })
    .addCase(logoutSucceeded, () => initialState);
});
