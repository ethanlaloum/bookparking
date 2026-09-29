import { parseConsent, type Consent } from '../domain/entities/Consent';
import type { ConsentStore } from '../domain/ports/ConsentStore';

const STORAGE_KEY = 'bookparking.consent';

export class LocalStorageConsentStore implements ConsentStore {
  read(): Consent | null {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw === null ? null : parseConsent(JSON.parse(raw));
    } catch {
      return null;
    }
  }

  save(consent: Consent): void {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
    } catch {
      /* navigation privée ou stockage refusé : la question sera reposée au rechargement */
    }
  }
}
