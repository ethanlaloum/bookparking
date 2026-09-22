import { createAction } from '@reduxjs/toolkit';
import { catchError, exhaustMap, filter, mergeMap, of } from 'rxjs';

import type { AppEpic } from '../../../../../store/AppEpic';
import { listListingsRequested } from '../list-listings/listListingsEpic';

export const unpublishListingRequested = createAction<{ id: string }>(
  'listing/unpublishListingRequested',
);
export const unpublishListingSucceeded = createAction<{ id: string }>(
  'listing/unpublishListingSucceeded',
);
export const unpublishListingFailed = createAction<{ errorCode: string }>(
  'listing/unpublishListingFailed',
);
export const resetUnpublishListingState = createAction('listing/resetUnpublishListingState');

export const unpublishListingEpic: AppEpic = (action$, _state$, { listingGateway }) =>
  action$.pipe(
    filter(unpublishListingRequested.match),
    exhaustMap((action) =>
      listingGateway.unpublish(action.payload.id).pipe(
        mergeMap(() => [
          unpublishListingSucceeded({ id: action.payload.id }),
          listListingsRequested(),
        ]),
        catchError((error: Error) => of(unpublishListingFailed({ errorCode: error.message }))),
      ),
    ),
  );
