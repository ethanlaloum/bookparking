import { createAction } from '@reduxjs/toolkit';
import { EMPTY, exhaustMap, filter, map, mergeMap, of, toArray, withLatestFrom } from 'rxjs';

import type { AppEpic } from '../../../../../store/AppEpic';
import type { LocatedAddress } from '../../entities/Coordinates';

export interface LocatedListing {
  listingId: string;
  located: LocatedAddress;
}

export const locateListingsRequested = createAction('listing/locateListingsRequested');
export const locateListingsSucceeded = createAction<LocatedListing[]>(
  'listing/locateListingsSucceeded',
);

// Quatre requêtes en vol au maximum : la Base Adresse Nationale est un service
// public gratuit, et lui envoyer une rafale par ouverture de carte serait
// impoli autant que fragile.
const MAX_CONCURRENT_LOOKUPS = 4;

/**
 * Géocode les annonces déjà en mémoire, une fois. `exhaustMap` laisse tomber un
 * second déclenchement pendant que le premier tourne — rouvrir la carte ne
 * relance pas la rafale. Les annonces viennent de `state$` et non de la charge :
 * l'écran demande « place ce que tu as », il ne transporte pas la liste.
 */
export const locateListingsEpic: AppEpic = (action$, state$, { geocodingGateway }) =>
  action$.pipe(
    filter(locateListingsRequested.match),
    withLatestFrom(state$),
    exhaustMap(([, state]) => {
      const pending = state.core.listing.listings.filter(
        (listing) => state.core.listing.locations[listing.id] === undefined,
      );
      if (pending.length === 0) return EMPTY;

      return of(...pending).pipe(
        mergeMap(
          (listing) =>
            geocodingGateway.locate(listing.address).pipe(
              map((located) => (located === null ? null : { listingId: listing.id, located })),
            ),
          MAX_CONCURRENT_LOOKUPS,
        ),
        toArray(),
        map((results) =>
          locateListingsSucceeded(
            results.filter((result): result is LocatedListing => result !== null),
          ),
        ),
      );
    }),
  );
