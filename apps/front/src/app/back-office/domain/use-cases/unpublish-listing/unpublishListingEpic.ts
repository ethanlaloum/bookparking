import { createAction } from '@reduxjs/toolkit';
import { catchError, concatMap, filter, mergeMap, of } from 'rxjs';

import type { AppEpic } from '../../../../../store/AppEpic';
import { failureOf, type Failure } from '../../ports/BackOfficeGateway';
import { listListingsRequested } from '../list-listings/listListingsEpic';
import { readOverviewRequested } from '../read-overview/readOverviewEpic';

export interface ModerationCommand {
  targetId: string;
  reason: string;
}

export const unpublishListingRequested = createAction<ModerationCommand>(
  'backOffice/unpublishListingRequested',
);
export const unpublishListingSucceeded = createAction<{ targetId: string }>(
  'backOffice/unpublishListingSucceeded',
);
export const unpublishListingFailed = createAction<Failure>('backOffice/unpublishListingFailed');

/**
 * `concatMap`, et non l'`exhaustMap` qui est le défaut ailleurs : deux
 * dépublications portent sur deux annonces différentes, et `exhaustMap`
 * laisserait tomber la seconde sans rien dire. Les actions partent donc l'une
 * après l'autre, dans l'ordre où l'administrateur les a décidées.
 *
 * L'api répond 204 sans corps : la liste se relit, et le tableau de bord avec
 * elle — dépublier change `activeListings` autant que la ligne elle-même.
 */
export const unpublishListingEpic: AppEpic = (action$, _state$, { backOfficeGateway }) =>
  action$.pipe(
    filter(unpublishListingRequested.match),
    concatMap((action) =>
      backOfficeGateway
        .unpublishListing(action.payload.targetId, action.payload.reason)
        .pipe(
          mergeMap(() => [
            unpublishListingSucceeded({ targetId: action.payload.targetId }),
            listListingsRequested(),
            readOverviewRequested(),
          ]),
          catchError((error: Error) => of(unpublishListingFailed(failureOf(error)))),
        ),
    ),
  );
