import type { Consent } from '@front/app/consent/domain/entities/Consent';
import type { ConsentStore } from '@front/app/consent/domain/ports/ConsentStore';

/**
 * Le bandeau du site demande l'accord pour deux tiers appelés sans que le
 * visiteur l'ait demandé : les polices Google et les tuiles OpenStreetMap.
 * L'app n'appelle ni l'un ni l'autre — les polices sont embarquées, la carte
 * est celle du système. Il n'y a donc rien à consentir, et rien à retenir : ce
 * magasin ne lit aucune décision et n'en écrit aucune. Le jour où l'app
 * appellera un tiers de son propre chef, c'est ici qu'un vrai magasin viendra,
 * avec son écran.
 */
export class NoThirdPartyConsentStore implements ConsentStore {
  read(): Consent | null {
    return null;
  }

  save(_consent: Consent): void {
    /* rien à retenir */
  }
}
