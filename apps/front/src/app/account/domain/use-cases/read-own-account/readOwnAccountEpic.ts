import { createAction } from '@reduxjs/toolkit';
import { catchError, exhaustMap, filter, map, of } from 'rxjs';

import type { AppEpic } from '../../../../../store/AppEpic';
import type { OwnAccount } from '../../entities/Account';

export const readOwnAccountRequested = createAction('account/readOwnAccountRequested');
export const readOwnAccountSucceeded = createAction<OwnAccount>('account/readOwnAccountSucceeded');
export const readOwnAccountFailed = createAction<{ errorCode: string }>(
  'account/readOwnAccountFailed',
);

/**
 * `POST /session` ne rend qu'un jeton : l'adresse et l'avatar du compte
 * connecté viennent de `GET /account`. L'en-tête du site et la barre d'onglets
 * de l'app le demandent dès qu'une session est ouverte — après une connexion,
 * une inscription ou un rechargement.
 */
export const readOwnAccountEpic: AppEpic = (action$, _state$, { accountGateway }) =>
  action$.pipe(
    filter(readOwnAccountRequested.match),
    exhaustMap(() =>
      accountGateway.readOwnAccount().pipe(
        map((account) => readOwnAccountSucceeded(account)),
        catchError((error: Error) => of(readOwnAccountFailed({ errorCode: error.message }))),
      ),
    ),
  );
