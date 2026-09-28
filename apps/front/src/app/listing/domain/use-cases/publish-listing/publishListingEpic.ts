import { createAction } from '@reduxjs/toolkit';
import { catchError, exhaustMap, filter, mergeMap, of, switchMap } from 'rxjs';

import type { AppEpic } from '../../../../../store/AppEpic';
import type { PublishListingDraft } from '../../entities/ListingPhoto';
import { listListingsRequested } from '../list-listings/listListingsEpic';
import { uploadListingPhotos } from '../upload-listing-photos/uploadListingPhotos';

export const publishListingRequested = createAction<PublishListingDraft>(
  'listing/publishListingRequested',
);
export const publishListingSucceeded = createAction('listing/publishListingSucceeded');
export const publishListingFailed = createAction<{ errorCode: string }>(
  'listing/publishListingFailed',
);
export const resetPublishListingState = createAction('listing/resetPublishListingState');

/**
 * `POST /listing` répond 201 sans corps : l'annonce publiée n'a pas d'identifiant
 * côté client. Le seul moyen de la retrouver est de relire la liste, d'où le
 * `listListingsRequested` re-dispatché ici plutôt qu'une insertion optimiste.
 */
export const publishListingEpic: AppEpic = (action$, _state$, { listingGateway }) =>
  action$.pipe(
    filter(publishListingRequested.match),
    exhaustMap((action) =>
      uploadListingPhotos(action.payload.photos, listingGateway).pipe(
        switchMap((photos) => listingGateway.publish({ ...action.payload, photos })),
        mergeMap(() => [publishListingSucceeded(), listListingsRequested()]),
        catchError((error: Error) => of(publishListingFailed({ errorCode: error.message }))),
      ),
    ),
  );
