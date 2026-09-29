import * as SecureStore from 'expo-secure-store';

import type { Session } from '@front/app/auth/domain/entities/Session';
import type { SessionStore } from '@front/app/auth/domain/ports/SessionStore';

const STORAGE_KEY = 'bookparking.session';

/**
 * Le pendant mobile de `LocalStorageSessionStore` : le jeton va dans le
 * trousseau iOS, pas dans un stockage en clair. Le port est synchrone — le
 * store lit la session avant son premier rendu — et `expo-secure-store` offre
 * justement une lecture et une écriture synchrones. Seul l'effacement est
 * asynchrone ; une session effacée une fraction de seconde plus tard ne se
 * relit jamais, puisque le store l'a déjà oubliée.
 */
export class SecureStoreSessionStore implements SessionStore {
  read(): Session | null {
    try {
      const raw = SecureStore.getItem(STORAGE_KEY);
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
      SecureStore.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      /* trousseau indisponible : la session ne survit pas au redémarrage */
    }
  }

  clear(): void {
    SecureStore.deleteItemAsync(STORAGE_KEY).catch(() => {
      /* idem */
    });
  }
}
