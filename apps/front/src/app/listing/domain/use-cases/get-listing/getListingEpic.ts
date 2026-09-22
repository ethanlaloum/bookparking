import { createAction } from '@reduxjs/toolkit';
import { catchError, filter, map, of, switchMap } from 'rxjs';

import type { AppEpic } from '../../../../../store/AppEpic';
import type { Listing } from '../../entities/Listing';

export const getListingRequested = createAction<{ id: string }>('listing/getListingRequested');
export const getListingSucceeded = createAction<Listing>('listing/getListingSucceeded');
export const getListingFailed = createAction<{ errorCode: string }>('listing/getListingFailed');
export const resetGetListingState = createAction('listing/resetGetListingState');

export const getListingEpic: AppEpic = (action$, _state$, { listingGateway }) =>
  action$.pipe(
    filter(getListingRequested.match),
    switchMap((action) =>
      listingGateway.getById(action.payload.id).pipe(
        map((listing) => getListingSucceeded(listing)),
        catchError((error: Error) => of(getListingFailed({ errorCode: error.message }))),
      ),
    ),
  );
