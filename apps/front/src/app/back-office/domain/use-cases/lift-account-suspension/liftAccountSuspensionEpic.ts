import { createAction } from '@reduxjs/toolkit';
import { catchError, concatMap, filter, mergeMap, of } from 'rxjs';

import type { AppEpic } from '../../../../../store/AppEpic';
import { failureOf, type Failure } from '../../ports/BackOfficeGateway';
import { listAccountsRequested } from '../list-accounts/listAccountsEpic';
import { readOverviewRequested } from '../read-overview/readOverviewEpic';
import type { ModerationCommand } from '../unpublish-listing/unpublishListingEpic';

export const liftAccountSuspensionRequested = createAction<ModerationCommand>(
  'backOffice/liftAccountSuspensionRequested',
);
export const liftAccountSuspensionSucceeded = createAction<{ targetId: string }>(
  'backOffice/liftAccountSuspensionSucceeded',
);
export const liftAccountSuspensionFailed = createAction<Failure>(
  'backOffice/liftAccountSuspensionFailed',
);

export const liftAccountSuspensionEpic: AppEpic = (action$, _state$, { backOfficeGateway }) =>
  action$.pipe(
    filter(liftAccountSuspensionRequested.match),
    concatMap((action) =>
      backOfficeGateway
        .liftAccountSuspension(action.payload.targetId, action.payload.reason)
        .pipe(
          mergeMap(() => [
            liftAccountSuspensionSucceeded({ targetId: action.payload.targetId }),
            listAccountsRequested(),
            readOverviewRequested(),
          ]),
          catchError((error: Error) => of(liftAccountSuspensionFailed(failureOf(error)))),
        ),
    ),
  );
