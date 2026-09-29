import { createAction } from '@reduxjs/toolkit';
import { catchError, exhaustMap, filter, map, of } from 'rxjs';

import type { AppEpic } from '../../../../../store/AppEpic';
import type { RentalRequestView } from '../../entities/RentalRequestView';

export const listReceivedRentalRequestsRequested = createAction(
  'rental/listReceivedRentalRequestsRequested',
);
export const listReceivedRentalRequestsSucceeded = createAction<RentalRequestView[]>(
  'rental/listReceivedRentalRequestsSucceeded',
);
export const listReceivedRentalRequestsFailed = createAction<{ errorCode: string }>(
  'rental/listReceivedRentalRequestsFailed',
);

export const listReceivedRentalRequestsEpic: AppEpic = (action$, _state$, { rentalGateway }) =>
  action$.pipe(
    filter(listReceivedRentalRequestsRequested.match),
    exhaustMap(() =>
      rentalGateway.listReceived().pipe(
        map((requests) => listReceivedRentalRequestsSucceeded(requests)),
        catchError((error: Error) =>
          of(listReceivedRentalRequestsFailed({ errorCode: error.message })),
        ),
      ),
    ),
  );
