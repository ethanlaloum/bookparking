import { isSessionLive, type Session } from '@front/app/auth/domain/entities/Session';

import type { AppState } from '../store/AppState';

export const selectSession = (state: AppState): Session | null => state.core.auth.session;

export const selectIsAuthenticated = (state: AppState): boolean =>
  isSessionLive(state.core.auth.session, new Date());

export const selectSignInLoading = (state: AppState): boolean =>
  state.core.auth.signIn.state === 'pending';

export const selectSignInError = (state: AppState): string | null =>
  state.core.auth.signIn.state === 'failed' ? (state.core.auth.signIn.errorCode ?? null) : null;

/**
 * Le 403 de la sonde parle d'« action réservée » : l'écran de connexion le
 * remplace par sa propre phrase, qui parle du compte.
 */
export const selectSignInRefusedAsNotAdmin = (state: AppState): boolean =>
  state.core.auth.signIn.state === 'failed' && state.core.auth.signInFailureKind === 'forbidden';
