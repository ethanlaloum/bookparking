import { createAction } from '@reduxjs/toolkit';
import { catchError, concatMap, filter, mergeMap, of } from 'rxjs';

import type { AppEpic } from '../../../../../store/AppEpic';
import { failureOf, type Failure } from '../../ports/BackOfficeGateway';
import { listRentalRequestsRequested } from '../list-rental-requests/listRentalRequestsEpic';
import { readOverviewRequested } from '../read-overview/readOverviewEpic';
import type { ModerationCommand } from '../unpublish-listing/unpublishListingEpic';

export const cancelRentalRequestRequested = createAction<ModerationCommand>(
  'backOffice/cancelRentalRequestRequested',
);
export const cancelRentalRequestSucceeded = createAction<{ targetId: string }>(
  'backOffice/cancelRentalRequestSucceeded',
);
export const cancelRentalRequestFailed = createAction<Failure>(
  'backOffice/cancelRentalRequestFailed',
);

export const cancelRentalRequestEpic: AppEpic = (action$, _state$, { backOfficeGateway }) =>
  action$.pipe(
    filter(cancelRentalRequestRequested.match),
    concatMap((action) =>
      backOfficeGateway
        .cancelRentalRequest(action.payload.targetId, action.payload.reason)
        .pipe(
          mergeMap(() => [
            cancelRentalRequestSucceeded({ targetId: action.payload.targetId }),
            listRentalRequestsRequested(),
            readOverviewRequested(),
          ]),
          catchError((error: Error) => of(cancelRentalRequestFailed(failureOf(error)))),
        ),
    ),
  );
