import { createAction } from '@reduxjs/toolkit';
import { catchError, exhaustMap, filter, map, of, switchMap } from 'rxjs';

import type { AppEpic } from '../../../../../store/AppEpic';
import type { ListingContentDraft } from '../../entities/ListingPhoto';
import type { OwnerListing } from '../../ports/ListingGateway';
import { uploadListingPhotos } from '../upload-listing-photos/uploadListingPhotos';

export const editListingRequested = createAction<{
  id: string;
  listing: ListingContentDraft;
}>('listing/editListingRequested');
export const editListingSucceeded = createAction<OwnerListing>('listing/editListingSucceeded');
export const editListingFailed = createAction<{ errorCode: string }>('listing/editListingFailed');
export const resetEditListingState = createAction('listing/resetEditListingState');

export const editListingEpic: AppEpic = (action$, _state$, { listingGateway }) =>
  action$.pipe(
    filter(editListingRequested.match),
    exhaustMap((action) =>
      uploadListingPhotos(action.payload.listing.photos, listingGateway).pipe(
        switchMap((photos) =>
          listingGateway.edit(action.payload.id, { ...action.payload.listing, photos }),
        ),
        map((listing) => editListingSucceeded(listing)),
        catchError((error: Error) => of(editListingFailed({ errorCode: error.message }))),
      ),
    ),
  );
