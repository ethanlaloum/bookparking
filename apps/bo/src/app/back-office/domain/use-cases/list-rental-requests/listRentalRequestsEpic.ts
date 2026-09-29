import { createAction } from '@reduxjs/toolkit';
import { catchError, exhaustMap, filter, map, of } from 'rxjs';

import type { AppEpic } from '../../../../../store/AppEpic';
import type { AdminRentalRequest } from '../../entities/AdminRentalRequest';
import { failureOf, type Failure } from '../../ports/BackOfficeGateway';

export const listRentalRequestsRequested = createAction('backOffice/listRentalRequestsRequested');
export const listRentalRequestsSucceeded = createAction<AdminRentalRequest[]>(
  'backOffice/listRentalRequestsSucceeded',
);
export const listRentalRequestsFailed = createAction<Failure>(
  'backOffice/listRentalRequestsFailed',
);

export const listRentalRequestsEpic: AppEpic = (action$, _state$, { backOfficeGateway }) =>
  action$.pipe(
    filter(listRentalRequestsRequested.match),
    exhaustMap(() =>
      backOfficeGateway.listRentalRequests().pipe(
        map((requests) => listRentalRequestsSucceeded(requests)),
        catchError((error: Error) => of(listRentalRequestsFailed(failureOf(error)))),
      ),
    ),
  );
