import { createAction } from '@reduxjs/toolkit';
import { catchError, exhaustMap, filter, mergeMap, of } from 'rxjs';

import type { AppEpic } from '../../../../../store/AppEpic';
import { listReceivedRentalRequestsRequested } from '../list-received-rental-requests/listReceivedRentalRequestsEpic';

export const confirmRentalRequestRequested = createAction<{ requestId: string }>(
  'rental/confirmRentalRequestRequested',
);
export const confirmRentalRequestSucceeded = createAction<{ requestId: string }>(
  'rental/confirmRentalRequestSucceeded',
);
export const confirmRentalRequestFailed = createAction<{ errorCode: string }>(
  'rental/confirmRentalRequestFailed',
);
export const resetConfirmRentalRequestState = createAction(
  'rental/resetConfirmRentalRequestState',
);

export const confirmRentalRequestEpic: AppEpic = (action$, _state$, { rentalGateway }) =>
  action$.pipe(
    filter(confirmRentalRequestRequested.match),
    exhaustMap((action) =>
      rentalGateway.confirm(action.payload.requestId).pipe(
        mergeMap(() => [
          confirmRentalRequestSucceeded({ requestId: action.payload.requestId }),
          listReceivedRentalRequestsRequested(),
        ]),
        catchError((error: Error) => of(confirmRentalRequestFailed({ errorCode: error.message }))),
      ),
    ),
  );
