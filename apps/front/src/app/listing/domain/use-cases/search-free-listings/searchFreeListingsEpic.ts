import { createAction } from '@reduxjs/toolkit';
import { catchError, EMPTY, filter, map, of, switchMap } from 'rxjs';

import type { AppEpic } from '../../../../../store/AppEpic';
import type { SearchedStay } from '../../entities/SearchCriteria';

export const freeListingsRequested = createAction<SearchedStay>('listing/freeListingsRequested');
export const freeListingsSucceeded = createAction<{ stay: SearchedStay; listingIds: string[] }>(
  'listing/freeListingsSucceeded',
);
export const freeListingsFailed = createAction<{ stay: SearchedStay; errorCode: string }>(
  'listing/freeListingsFailed',
);
export const freeListingsCleared = createAction('listing/freeListingsCleared');

export const searchFreeListingsEpic: AppEpic = (action$, _state$, { listingGateway }) =>
  action$.pipe(
    filter((action) => freeListingsRequested.match(action) || freeListingsCleared.match(action)),
    switchMap((action) => {
      if (!freeListingsRequested.match(action)) return EMPTY;
      const stay = action.payload;
      return listingGateway.listFree(stay).pipe(
        map((listings) =>
          freeListingsSucceeded({ stay, listingIds: listings.map((listing) => listing.id) }),
        ),
        catchError((error: Error) => of(freeListingsFailed({ stay, errorCode: error.message }))),
      );
    }),
  );
