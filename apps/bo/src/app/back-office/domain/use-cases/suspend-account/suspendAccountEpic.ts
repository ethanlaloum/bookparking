import { createAction } from '@reduxjs/toolkit';
import { catchError, concatMap, filter, mergeMap, of } from 'rxjs';

import type { AppEpic } from '../../../../../store/AppEpic';
import { failureOf, type Failure } from '../../ports/BackOfficeGateway';
import { listAccountsRequested } from '../list-accounts/listAccountsEpic';
import { readOverviewRequested } from '../read-overview/readOverviewEpic';
import type { ModerationCommand } from '../unpublish-listing/unpublishListingEpic';

export const suspendAccountRequested = createAction<ModerationCommand>(
  'backOffice/suspendAccountRequested',
);
export const suspendAccountSucceeded = createAction<{ targetId: string }>(
  'backOffice/suspendAccountSucceeded',
);
export const suspendAccountFailed = createAction<Failure>('backOffice/suspendAccountFailed');

export const suspendAccountEpic: AppEpic = (action$, _state$, { backOfficeGateway }) =>
  action$.pipe(
    filter(suspendAccountRequested.match),
    concatMap((action) =>
      backOfficeGateway
        .suspendAccount(action.payload.targetId, action.payload.reason)
        .pipe(
          mergeMap(() => [
            suspendAccountSucceeded({ targetId: action.payload.targetId }),
            listAccountsRequested(),
            readOverviewRequested(),
          ]),
          catchError((error: Error) => of(suspendAccountFailed(failureOf(error)))),
        ),
    ),
  );
