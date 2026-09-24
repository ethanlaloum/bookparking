import type { Consent } from '../entities/Consent';

export interface ConsentStore {
  read(): Consent | null;
  save(consent: Consent): void;
}
