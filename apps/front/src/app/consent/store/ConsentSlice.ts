import { createReducer } from '@reduxjs/toolkit';

import type { Consent } from '../domain/entities/Consent';
import { recordConsentSucceeded } from '../domain/use-cases/record-consent/recordConsentEpic';
import { consentSettingsClosed, consentSettingsOpened } from './consentSettings';

export interface ConsentState {
  consent: Consent | null;
  settingsOpen: boolean;
}

const initialState: ConsentState = {
  consent: null,
  settingsOpen: false,
};

export const buildInitialConsentState = (consent: Consent | null): ConsentState => ({
  ...initialState,
  consent,
});

// Aucune remise à zéro sur `logoutSucceeded` : le choix appartient au
// navigateur, pas au compte. Se déconnecter ne doit pas reposer la question.
export const consentReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(consentSettingsOpened, (state) => {
      state.settingsOpen = true;
    })
    .addCase(consentSettingsClosed, (state) => {
      state.settingsOpen = false;
    })
    .addCase(recordConsentSucceeded, (state, action) => {
      state.consent = action.payload;
      state.settingsOpen = false;
    });
});
