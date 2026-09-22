import { createAction } from '@reduxjs/toolkit';
import { catchError, exhaustMap, filter, mergeMap, of } from 'rxjs';

import { signInRequested } from '../../../../auth/domain/use-cases/sign-in/signInEpic';
import type { AppEpic } from '../../../../../store/AppEpic';
import type { Account } from '../../entities/Account';
import type { RegisterAccountPayload } from '../../ports/AccountGateway';

export const registerAccountRequested = createAction<RegisterAccountPayload>(
  'account/registerAccountRequested',
);
export const registerAccountSucceeded = createAction<Account>('account/registerAccountSucceeded');
export const registerAccountFailed = createAction<{ errorCode: string }>(
  'account/registerAccountFailed',
);
export const resetRegisterAccountState = createAction('account/resetRegisterAccountState');

/**
 * L'inscription enchaîne sur une connexion : `POST /account` ne rend aucun
 * jeton, et demander au nouvel inscrit de ressaisir les identifiants qu'il
 * vient de choisir serait gratuit. Les identifiants viennent de la charge
 * soumise, jamais de `state$`, que le scheduler de redux-observable pourrait
 * livrer encore périmé.
 */
export const registerAccountEpic: AppEpic = (action$, _state$, { accountGateway }) =>
  action$.pipe(
    filter(registerAccountRequested.match),
    exhaustMap((action) =>
      accountGateway.register(action.payload).pipe(
        mergeMap((account) => [
          registerAccountSucceeded(account),
          signInRequested({ email: action.payload.email, password: action.payload.password }),
        ]),
        catchError((error: Error) => of(registerAccountFailed({ errorCode: error.message }))),
      ),
    ),
  );
