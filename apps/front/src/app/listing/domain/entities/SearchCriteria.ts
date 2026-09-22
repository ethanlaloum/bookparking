import type { Coordinates } from './Coordinates';
import type { Pricing } from './Listing';

export const RENTAL_TIERS = ['day', 'week', 'month'] as const;
export type RentalTier = (typeof RENTAL_TIERS)[number];

/**
 * Le vocabulaire est celui du contrat : une annonce déclare ce qu'elle accepte,
 * et la recherche interroge la même liste. `electrique` dit plus qu'un
 * gabarit — il annonce une borne de recharge ; mêler gabarit et équipement
 * dans une seule liste est une simplification assumée.
 */
export const VEHICLE_TYPES = ['velo', 'moto', 'voiture', 'electrique', 'utilitaire'] as const;
export type VehicleType = (typeof VEHICLE_TYPES)[number];

/**
 * Une place qui n'a rien déclaré n'exclut personne : l'absence d'information
 * n'est pas un refus. La masquer ferait croire qu'elle n'existe pas — même
 * discipline que la proximité, qui met en avant sans filtrer.
 */
export const acceptsVehicle = (
  acceptedVehicles: readonly string[],
  vehicle: VehicleType,
): boolean => acceptedVehicles.length === 0 || acceptedVehicles.includes(vehicle);

export const declaresVehicles = (acceptedVehicles: readonly string[]): boolean =>
  acceptedVehicles.length > 0;

export interface SearchedAddress {
  label: string;
  coordinates: Coordinates;
}

export interface SearchCriteria {
  address: SearchedAddress | null;
  vehicle: VehicleType | null;
  tier: RentalTier | null;
}

export const EMPTY_CRITERIA: SearchCriteria = { address: null, vehicle: null, tier: null };

export const priceForTier = (pricing: Pricing, tier: RentalTier): number | null => {
  if (tier === 'day') return pricing.dayInCents;
  if (tier === 'week') return pricing.weekInCents;
  return pricing.monthInCents;
};

export const offersTier = (pricing: Pricing, tier: RentalTier): boolean =>
  priceForTier(pricing, tier) !== null;

const isVehicleType = (value: string | null): value is VehicleType =>
  value !== null && (VEHICLE_TYPES as readonly string[]).includes(value);

const isRentalTier = (value: string | null): value is RentalTier =>
  value !== null && (RENTAL_TIERS as readonly string[]).includes(value);

/**
 * L'URL est la seule mémoire de la recherche : elle survit au rechargement, se
 * partage, et se remonte dans l'historique. Un critère illisible est ignoré
 * plutôt que rejeté — une URL tronquée doit donner une recherche partielle, pas
 * une page en erreur.
 */
export const criteriaFromSearchParams = (params: URLSearchParams): SearchCriteria => {
  const label = params.get('adresse');
  const rawLatitude = params.get('lat');
  const rawLongitude = params.get('lon');

  // `Number(null)` vaut 0, et `Number.isFinite(0)` est vrai : convertir avant
  // d'avoir vérifié la présence placerait une adresse sans coordonnées au point
  // (0, 0), au large du golfe de Guinée, sans qu'aucune erreur ne le signale.
  const address =
    label !== null &&
    label !== '' &&
    rawLatitude !== null &&
    rawLongitude !== null &&
    Number.isFinite(Number(rawLatitude)) &&
    Number.isFinite(Number(rawLongitude))
      ? {
          label,
          coordinates: {
            latitude: Number(rawLatitude),
            longitude: Number(rawLongitude),
          },
        }
      : null;

  const vehicle = params.get('vehicule');
  const tier = params.get('duree');

  return {
    address,
    vehicle: isVehicleType(vehicle) ? vehicle : null,
    tier: isRentalTier(tier) ? tier : null,
  };
};

export const criteriaToSearchParams = (criteria: SearchCriteria): URLSearchParams => {
  const params = new URLSearchParams();
  if (criteria.address !== null) {
    params.set('adresse', criteria.address.label);
    params.set('lat', String(criteria.address.coordinates.latitude));
    params.set('lon', String(criteria.address.coordinates.longitude));
  }
  if (criteria.vehicle !== null) params.set('vehicule', criteria.vehicle);
  if (criteria.tier !== null) params.set('duree', criteria.tier);
  return params;
};

export const hasAnyCriterion = (criteria: SearchCriteria): boolean =>
  criteria.address !== null || criteria.vehicle !== null || criteria.tier !== null;
