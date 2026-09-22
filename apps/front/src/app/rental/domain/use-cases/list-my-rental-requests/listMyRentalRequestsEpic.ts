import { createAction } from '@reduxjs/toolkit';
import { catchError, exhaustMap, filter, map, of } from 'rxjs';

import type { AppEpic } from '../../../../../store/AppEpic';
import type { RentalRequestView } from '../../entities/RentalRequestView';

export const listMyRentalRequestsRequested = createAction(
  'rental/listMyRentalRequestsRequested',
);
export const listMyRentalRequestsSucceeded = createAction<RentalRequestView[]>(
  'rental/listMyRentalRequestsSucceeded',
);
export const listMyRentalRequestsFailed = createAction<{ errorCode: string }>(
  'rental/listMyRentalRequestsFailed',
);

export const listMyRentalRequestsEpic: AppEpic = (action$, _state$, { rentalGateway }) =>
  action$.pipe(
    filter(listMyRentalRequestsRequested.match),
    exhaustMap(() =>
      rentalGateway.listMine().pipe(
        map((requests) => listMyRentalRequestsSucceeded(requests)),
        catchError((error: Error) =>
          of(listMyRentalRequestsFailed({ errorCode: error.message })),
        ),
      ),
    ),
  );
