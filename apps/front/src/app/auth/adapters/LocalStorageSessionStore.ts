import type { Session } from '../domain/entities/Session';
import type { SessionStore } from '../domain/ports/SessionStore';

const STORAGE_KEY = 'bookparking.session';

export class LocalStorageSessionStore implements SessionStore {
  read(): Session | null {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw === null) return null;
      const parsed = JSON.parse(raw) as Partial<Session>;
      if (typeof parsed.token !== 'string' || typeof parsed.validUntil !== 'string') return null;
      return { token: parsed.token, validUntil: parsed.validUntil };
    } catch {
      return null;
    }
  }

  save(session: Session): void {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      /* navigation privée ou stockage refusé : la session ne survit pas au rechargement */
    }
  }

  clear(): void {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* idem */
    }
  }
}
