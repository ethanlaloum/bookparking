import { createAction } from '@reduxjs/toolkit';
import { catchError, exhaustMap, filter, map, of } from 'rxjs';

import type { AppEpic } from '../../../../../store/AppEpic';
import type { RequestRentalPayload } from '../../ports/RentalGateway';

export const requestRentalRequested = createAction<RequestRentalPayload>(
  'rental/requestRentalRequested',
);
export const requestRentalSucceeded = createAction<RequestRentalPayload>(
  'rental/requestRentalSucceeded',
);
export const requestRentalFailed = createAction<{ errorCode: string }>(
  'rental/requestRentalFailed',
);
export const resetRequestRentalState = createAction('rental/resetRequestRentalState');

/**
 * `POST /rental-request` répond 201 sans corps et aucune route ne liste les
 * demandes : l'identifiant créé n'atteint jamais le client. Le succès rejoue
 * donc la charge soumise, seule trace exploitable pour l'écran de confirmation.
 */
export const requestRentalEpic: AppEpic = (action$, _state$, { rentalGateway }) =>
  action$.pipe(
    filter(requestRentalRequested.match),
    exhaustMap((action) =>
      rentalGateway.request(action.payload).pipe(
        map(() => requestRentalSucceeded(action.payload)),
        catchError((error: Error) => of(requestRentalFailed({ errorCode: error.message }))),
      ),
    ),
  );
