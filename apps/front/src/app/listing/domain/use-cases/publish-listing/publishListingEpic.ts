import { createAction } from '@reduxjs/toolkit';
import { catchError, exhaustMap, filter, mergeMap, of } from 'rxjs';

import type { AppEpic } from '../../../../../store/AppEpic';
import type { PublishListingPayload } from '../../ports/ListingGateway';
import { listListingsRequested } from '../list-listings/listListingsEpic';

export const publishListingRequested = createAction<PublishListingPayload>(
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
      listingGateway.publish(action.payload).pipe(
        mergeMap(() => [publishListingSucceeded(), listListingsRequested()]),
        catchError((error: Error) => of(publishListingFailed({ errorCode: error.message }))),
      ),
    ),
  );
