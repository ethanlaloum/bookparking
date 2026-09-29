import { createAction } from '@reduxjs/toolkit';
import { filter, map, tap } from 'rxjs';

import type { AppEpic } from '../../../../../store/AppEpic';
import { recordConsent, type Consent, type ConsentChoices } from '../../entities/Consent';

export const recordConsentRequested = createAction<{ choices: ConsentChoices }>(
  'consent/recordConsentRequested',
);
export const recordConsentSucceeded = createAction<Consent>('consent/recordConsentSucceeded');

// Pas de `recordConsentFailed` : le magasin avale un stockage refusé, comme
// celui de la session. La décision vaut alors pour la page ouverte, et la
// question revient au rechargement — le refus par défaut, jamais un accord.
export const recordConsentEpic: AppEpic = (action$, _state$, { clock, consentStore }) =>
  action$.pipe(
    filter(recordConsentRequested.match),
    map((action) => recordConsent(action.payload.choices, clock.now())),
    tap((consent) => consentStore.save(consent)),
    map((consent) => recordConsentSucceeded(consent)),
  );
