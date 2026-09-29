import { createAction } from '@reduxjs/toolkit';
import { catchError, exhaustMap, filter, map, of } from 'rxjs';

import type { AppEpic } from '../../../../../store/AppEpic';
import type { Listing } from '../../entities/Listing';
import type { UpdatePricingPayload } from '../../ports/ListingGateway';

export const updateListingPricingRequested = createAction<{
  id: string;
  pricing: UpdatePricingPayload;
}>('listing/updateListingPricingRequested');
export const updateListingPricingSucceeded = createAction<Listing>(
  'listing/updateListingPricingSucceeded',
);
export const updateListingPricingFailed = createAction<{ errorCode: string }>(
  'listing/updateListingPricingFailed',
);
export const resetUpdateListingPricingState = createAction(
  'listing/resetUpdateListingPricingState',
);

export const updateListingPricingEpic: AppEpic = (action$, _state$, { listingGateway }) =>
  action$.pipe(
    filter(updateListingPricingRequested.match),
    exhaustMap((action) =>
      listingGateway.updatePricing(action.payload.id, action.payload.pricing).pipe(
        map((listing) => updateListingPricingSucceeded(listing)),
        catchError((error: Error) => of(updateListingPricingFailed({ errorCode: error.message }))),
      ),
    ),
  );
