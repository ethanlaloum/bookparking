import { createAction } from '@reduxjs/toolkit';
import { catchError, exhaustMap, filter, map, of } from 'rxjs';

import type { AppEpic } from '../../../../../store/AppEpic';

export const abandonRentalRequestRequested = createAction<{ requestId: string }>(
  'rental/abandonRentalRequestRequested',
);
export const abandonRentalRequestSucceeded = createAction<{ requestId: string }>(
  'rental/abandonRentalRequestSucceeded',
);
export const abandonRentalRequestFailed = createAction<{ errorCode: string }>(
  'rental/abandonRentalRequestFailed',
);

/**
 * Le conducteur revient de Stripe sans avoir payé : ses dates sont rendues
 * tout de suite, au lieu d'attendre que la page de paiement expire.
 */
export const abandonRentalRequestEpic: AppEpic = (action$, _state$, { rentalGateway }) =>
  action$.pipe(
    filter(abandonRentalRequestRequested.match),
    exhaustMap((action) =>
      rentalGateway.abandon(action.payload.requestId).pipe(
        map(() => abandonRentalRequestSucceeded(action.payload)),
        catchError((error: Error) => of(abandonRentalRequestFailed({ errorCode: error.message }))),
      ),
    ),
  );
