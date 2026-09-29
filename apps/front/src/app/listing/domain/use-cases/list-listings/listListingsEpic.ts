import { createAction } from '@reduxjs/toolkit';
import { catchError, exhaustMap, filter, map, of } from 'rxjs';

import type { AppEpic } from '../../../../../store/AppEpic';
import type { Listing } from '../../entities/Listing';

export const listListingsRequested = createAction('listing/listListingsRequested');
export const listListingsSucceeded = createAction<Listing[]>('listing/listListingsSucceeded');
export const listListingsFailed = createAction<{ errorCode: string }>('listing/listListingsFailed');

export const listListingsEpic: AppEpic = (action$, _state$, { listingGateway }) =>
  action$.pipe(
    filter(listListingsRequested.match),
    exhaustMap(() =>
      listingGateway.listActive().pipe(
        map((listings) => listListingsSucceeded(listings)),
        catchError((error: Error) => of(listListingsFailed({ errorCode: error.message }))),
      ),
    ),
  );
