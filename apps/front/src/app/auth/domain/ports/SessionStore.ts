import type { Session } from '../entities/Session';

export interface SessionStore {
  read(): Session | null;
  save(session: Session): void;
  clear(): void;
}
