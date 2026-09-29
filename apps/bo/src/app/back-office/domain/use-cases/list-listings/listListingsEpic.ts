import { createAction } from '@reduxjs/toolkit';
import { catchError, exhaustMap, filter, map, of } from 'rxjs';

import type { AppEpic } from '../../../../../store/AppEpic';
import type { AdminListing } from '../../entities/AdminListing';
import { failureOf, type Failure } from '../../ports/BackOfficeGateway';

export const listListingsRequested = createAction('backOffice/listListingsRequested');
export const listListingsSucceeded = createAction<AdminListing[]>(
  'backOffice/listListingsSucceeded',
);
export const listListingsFailed = createAction<Failure>('backOffice/listListingsFailed');

export const listListingsEpic: AppEpic = (action$, _state$, { backOfficeGateway }) =>
  action$.pipe(
    filter(listListingsRequested.match),
    exhaustMap(() =>
      backOfficeGateway.listListings().pipe(
        map((listings) => listListingsSucceeded(listings)),
        catchError((error: Error) => of(listListingsFailed(failureOf(error)))),
      ),
    ),
  );
