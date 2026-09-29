import { createAction } from '@reduxjs/toolkit';
import { catchError, exhaustMap, filter, from, of } from 'rxjs';

import type { AppEpic } from '../../../../../store/AppEpic';
import { logoutRequested } from '../../../../auth/domain/use-cases/sign-out/signOutEpic';

export const deleteAccountRequested = createAction<{ password: string }>(
  'account/deleteAccountRequested',
);
export const deleteAccountSucceeded = createAction('account/deleteAccountSucceeded');
export const deleteAccountFailed = createAction<{ errorCode: string }>(
  'account/deleteAccountFailed',
);
export const resetDeleteAccountState = createAction('account/resetDeleteAccountState');

/**
 * Le compte supprimé, son jeton ne vaut plus rien : la déconnexion suit
 * aussitôt, par le même chemin que le bouton « Se déconnecter » — session
 * oubliée, tranches remises à zéro, jeton de push oublié sur l'iPhone.
 */
export const deleteAccountEpic: AppEpic = (action$, _state$, { accountGateway }) =>
  action$.pipe(
    filter(deleteAccountRequested.match),
    exhaustMap((action) =>
      accountGateway.deleteAccount(action.payload.password).pipe(
        exhaustMap(() => from([deleteAccountSucceeded(), logoutRequested()])),
        catchError((error: Error) => of(deleteAccountFailed({ errorCode: error.message }))),
      ),
    ),
  );
