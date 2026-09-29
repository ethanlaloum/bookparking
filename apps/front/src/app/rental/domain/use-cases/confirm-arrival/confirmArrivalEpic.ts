import { createAction } from '@reduxjs/toolkit';
import { catchError, exhaustMap, filter, mergeMap, of } from 'rxjs';

import type { AppEpic } from '../../../../../store/AppEpic';
import { listMyRentalRequestsRequested } from '../list-my-rental-requests/listMyRentalRequestsEpic';

export const confirmArrivalRequested = createAction<{ requestId: string }>(
  'rental/confirmArrivalRequested',
);
export const confirmArrivalSucceeded = createAction<{ requestId: string }>(
  'rental/confirmArrivalSucceeded',
);
export const confirmArrivalFailed = createAction<{ errorCode: string }>('rental/confirmArrivalFailed');

// L'api répond sans corps : la liste est relue pour montrer l'arrivée.
export const confirmArrivalEpic: AppEpic = (action$, _state$, { rentalGateway }) =>
  action$.pipe(
    filter(confirmArrivalRequested.match),
    exhaustMap(({ payload }) =>
      rentalGateway.confirmArrival(payload.requestId).pipe(
        mergeMap(() =>
          of(
            confirmArrivalSucceeded({ requestId: payload.requestId }),
            listMyRentalRequestsRequested(),
          ),
        ),
        catchError((error: Error) => of(confirmArrivalFailed({ errorCode: error.message }))),
      ),
    ),
  );
