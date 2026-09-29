import { createAction } from '@reduxjs/toolkit';
import { catchError, exhaustMap, filter, map, of } from 'rxjs';

import type { AppEpic } from '../../../../../store/AppEpic';
import type { OwnerListing } from '../../ports/ListingGateway';

export const listOwnerListingsRequested = createAction('listing/listOwnerListingsRequested');
export const listOwnerListingsSucceeded = createAction<OwnerListing[]>(
  'listing/listOwnerListingsSucceeded',
);
export const listOwnerListingsFailed = createAction<{ errorCode: string }>(
  'listing/listOwnerListingsFailed',
);

export const listOwnerListingsEpic: AppEpic = (action$, _state$, { listingGateway }) =>
  action$.pipe(
    filter(listOwnerListingsRequested.match),
    exhaustMap(() =>
      listingGateway.listMine().pipe(
        map((listings) => listOwnerListingsSucceeded(listings)),
        catchError((error: Error) => of(listOwnerListingsFailed({ errorCode: error.message }))),
      ),
    ),
  );
