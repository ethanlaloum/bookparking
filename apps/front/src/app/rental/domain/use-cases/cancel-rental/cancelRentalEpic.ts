import { createAction } from '@reduxjs/toolkit';
import { catchError, exhaustMap, filter, mergeMap, of } from 'rxjs';

import type { AppEpic } from '../../../../../store/AppEpic';
import type { CancellationOutcome } from '../../ports/RentalGateway';
import { listMyRentalRequestsRequested } from '../list-my-rental-requests/listMyRentalRequestsEpic';
import { listReceivedRentalRequestsRequested } from '../list-received-rental-requests/listReceivedRentalRequestsEpic';

export const cancelRentalRequested = createAction<{ requestId: string }>(
  'rental/cancelRentalRequested',
);
export const cancelRentalSucceeded = createAction<{
  requestId: string;
  outcome: CancellationOutcome;
}>('rental/cancelRentalSucceeded');
export const cancelRentalFailed = createAction<{ errorCode: string }>(
  'rental/cancelRentalFailed',
);

/**
 * Le conducteur comme le loueur annulent par la même route. L'api répond ce
 * que l'annulation a fait de l'argent, sans rendre la demande : les deux
 * listes sont relues, faute de quoi l'une ou l'autre montrerait encore une
 * réservation active jusqu'au prochain rechargement.
 */
export const cancelRentalEpic: AppEpic = (action$, _state$, { rentalGateway }) =>
  action$.pipe(
    filter(cancelRentalRequested.match),
    exhaustMap((action) =>
      rentalGateway.cancel(action.payload.requestId).pipe(
        mergeMap((outcome) => [
          cancelRentalSucceeded({ requestId: action.payload.requestId, outcome }),
          listMyRentalRequestsRequested(),
          listReceivedRentalRequestsRequested(),
        ]),
        catchError((error: Error) => of(cancelRentalFailed({ errorCode: error.message }))),
      ),
    ),
  );
