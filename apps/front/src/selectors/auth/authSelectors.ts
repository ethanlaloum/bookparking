import { isSessionLive, type Session } from '../../app/auth/domain/entities/Session';
import type { CommonState } from '../../store/CommonState';
import type { AppState } from '../../store/AppState';

export const selectSession = (state: AppState): Session | null => state.core.auth.session;

export const selectIsAuthenticated = (state: AppState): boolean =>
  isSessionLive(state.core.auth.session, new Date());

export const selectSignIn = (state: AppState): CommonState => state.core.auth.signIn;

export const selectSignInLoading = (state: AppState): boolean =>
  state.core.auth.signIn.state === 'pending';

export const selectSignInError = (state: AppState): string | null =>
  state.core.auth.signIn.state === 'failed' ? (state.core.auth.signIn.errorCode ?? null) : null;

export const selectSignInSuccess = (state: AppState): boolean =>
  state.core.auth.signIn.state === 'succeeded';
