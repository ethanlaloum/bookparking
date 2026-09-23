import {
  allows,
  choicesOf,
  type Consent,
  type ConsentChoices,
  type ConsentPurpose,
} from '../../app/consent/domain/entities/Consent';
import type { AppState } from '../../store/AppState';

export const selectConsent = (state: AppState): Consent | null => state.core.consent.consent;

export const selectConsentChoices = (state: AppState): ConsentChoices =>
  choicesOf(state.core.consent.consent);

/** Vrai tant qu'aucune décision valable n'existe : c'est ce qui montre le bandeau. */
export const selectIsConsentAwaited = (state: AppState): boolean =>
  state.core.consent.consent === null;

export const selectIsPurposeAllowed = (state: AppState, purpose: ConsentPurpose): boolean =>
  allows(state.core.consent.consent, purpose);

export const selectAreConsentSettingsOpen = (state: AppState): boolean =>
  state.core.consent.settingsOpen;
