import { createAction } from '@reduxjs/toolkit';
import { debounceTime, distinctUntilChanged, filter, map, of, switchMap } from 'rxjs';

import type { AppEpic } from '../../../../../store/AppEpic';
import type { AddressSuggestion } from '../../entities/Coordinates';

export const MINIMUM_QUERY_LENGTH = 3;
const KEYSTROKE_QUIET_MS = 250;

export const addressQueryChanged = createAction<{ query: string }>(
  'listing/addressQueryChanged',
);
export const addressSuggestionsReceived = createAction<AddressSuggestion[]>(
  'listing/addressSuggestionsReceived',
);
export const addressSelected = createAction<AddressSuggestion>('listing/addressSelected');
export const addressSearchCleared = createAction('listing/addressSearchCleared');

/**
 * Le seul `switchMap` de l'application, et il est à sa place : sur une frappe,
 * la dernière requête gagne et la précédente ne vaut plus rien — l'annuler est
 * exactement ce qu'on veut. `exhaustMap` laisserait s'afficher les suggestions
 * d'un préfixe déjà effacé.
 *
 * `debounceTime` avant `distinctUntilChanged` : on ne compare que les frappes
 * qui ont survécu au silence, sinon un aller-retour sur la même chaîne
 * relancerait une requête identique.
 */
export const searchAddressEpic: AppEpic = (action$, _state$, { geocodingGateway }) =>
  action$.pipe(
    filter(addressQueryChanged.match),
    map((action) => action.payload.query.trim()),
    debounceTime(KEYSTROKE_QUIET_MS),
    distinctUntilChanged(),
    switchMap((query) =>
      query.length < MINIMUM_QUERY_LENGTH
        ? of(addressSuggestionsReceived([]))
        : geocodingGateway
            .suggest(query)
            .pipe(map((suggestions) => addressSuggestionsReceived(suggestions))),
    ),
  );
