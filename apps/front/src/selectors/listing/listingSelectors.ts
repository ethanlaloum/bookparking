import { createSelector } from '@reduxjs/toolkit';

import {
  cheapestNightlyRateInCents,
  type Listing,
} from '../../app/listing/domain/entities/Listing';
import {
  centerOf,
  CITY_ZOOM,
  distanceInKilometers,
  isWithinWalkingDistance,
  spanInKilometers,
  zoomForSpan,
  type AddressSuggestion,
  type Coordinates,
  type LocatedAddress,
} from '../../app/listing/domain/entities/Coordinates';
import {
  acceptsVehicle,
  declaresVehicles,
  type VehicleType,
} from '../../app/listing/domain/entities/SearchCriteria';
import type { OwnerListing } from '../../app/listing/domain/ports/ListingGateway';
import type { AppState } from '../../store/AppState';

export const selectListings = (state: AppState): Listing[] => state.core.listing.listings;

export const selectListingsLoading = (state: AppState): boolean =>
  state.core.listing.list.state === 'pending';

export const selectListingsError = (state: AppState): string | null =>
  state.core.listing.list.state === 'failed' ? (state.core.listing.list.errorCode ?? null) : null;

export const selectListingsLoaded = (state: AppState): boolean =>
  state.core.listing.list.state === 'succeeded';

export const selectSelectedListing = (state: AppState): Listing | null =>
  state.core.listing.selected;

export const selectListingLoading = (state: AppState): boolean =>
  state.core.listing.get.state === 'pending';

export const selectListingError = (state: AppState): string | null =>
  state.core.listing.get.state === 'failed' ? (state.core.listing.get.errorCode ?? null) : null;

export const selectPublishLoading = (state: AppState): boolean =>
  state.core.listing.publish.state === 'pending';

export const selectPublishError = (state: AppState): string | null =>
  state.core.listing.publish.state === 'failed'
    ? (state.core.listing.publish.errorCode ?? null)
    : null;

export const selectPublishSuccess = (state: AppState): boolean =>
  state.core.listing.publish.state === 'succeeded';

export const selectUnpublishLoading = (state: AppState): boolean =>
  state.core.listing.unpublish.state === 'pending';

export const selectUnpublishError = (state: AppState): string | null =>
  state.core.listing.unpublish.state === 'failed'
    ? (state.core.listing.unpublish.errorCode ?? null)
    : null;

export const selectUpdatePricingLoading = (state: AppState): boolean =>
  state.core.listing.updatePricing.state === 'pending';

export const selectUpdatePricingError = (state: AppState): string | null =>
  state.core.listing.updatePricing.state === 'failed'
    ? (state.core.listing.updatePricing.errorCode ?? null)
    : null;

export const selectUpdatePricingSuccess = (state: AppState): boolean =>
  state.core.listing.updatePricing.state === 'succeeded';

export const selectCheapestRateInCents = createSelector([selectListings], (listings) => {
  const rates = listings
    .map((listing) => cheapestNightlyRateInCents(listing.pricing))
    .filter((rate): rate is number => rate !== null);
  return rates.length === 0 ? null : Math.min(...rates);
});

export const selectOwnerListings = (state: AppState): OwnerListing[] =>
  state.core.listing.ownerListings;

export const selectOwnerListingsLoading = (state: AppState): boolean =>
  state.core.listing.listOwner.state === 'pending';

export const selectOwnerListingsLoaded = (state: AppState): boolean =>
  state.core.listing.listOwner.state === 'succeeded';

export const selectOwnerListingsError = (state: AppState): string | null =>
  state.core.listing.listOwner.state === 'failed'
    ? (state.core.listing.listOwner.errorCode ?? null)
    : null;

export const selectActiveOwnerListings = createSelector([selectOwnerListings], (listings) =>
  listings.filter((listing) => listing.status === 'ACTIVE'),
);

export interface MappedListing {
  listing: Listing;
  located: LocatedAddress;
}

export const selectLocations = (state: AppState): Record<string, LocatedAddress> =>
  state.core.listing.locations;

export const selectLocating = (state: AppState): boolean =>
  state.core.listing.locate.state === 'pending';

export const selectLocated = (state: AppState): boolean =>
  state.core.listing.locate.state === 'succeeded';

export const selectMappedListings = createSelector(
  [selectListings, selectLocations],
  (listings, locations): MappedListing[] =>
    listings
      .map((listing) => ({ listing, located: locations[listing.id] }))
      .filter((entry): entry is MappedListing => entry.located !== undefined),
);

export const selectUnmappableCount = createSelector(
  [selectListings, selectLocations],
  (listings, locations) =>
    listings.filter((listing) => locations[listing.id] === undefined).length,
);

const coordinatesOf = (mapped: MappedListing[]): Coordinates[] =>
  mapped.map((entry) => entry.located.coordinates);

export const selectMapCenter = createSelector([selectMappedListings], (mapped): Coordinates =>
  centerOf(coordinatesOf(mapped)),
);

export const selectMapZoom = createSelector([selectMappedListings], (mapped): number =>
  zoomForSpan(spanInKilometers(coordinatesOf(mapped))),
);

export const selectApproximateCount = createSelector(
  [selectMappedListings],
  (mapped) => mapped.filter((entry) => entry.located.precision === 'approximate').length,
);

export const selectAddressSuggestions = (state: AppState): AddressSuggestion[] =>
  state.core.listing.suggestions;

export const selectSearchPoint = (state: AppState): Coordinates | null =>
  state.core.listing.searchPoint;

export const selectSearchLabel = (state: AppState): string | null =>
  state.core.listing.searchLabel;

export interface MappedListingWithDistance extends MappedListing {
  distanceKm: number | null;
  nearby: boolean;
}

/**
 * Les places restent toutes présentes, classées par distance quand une adresse
 * est cherchée : on met en avant, on ne masque pas. Une carte qui cacherait des
 * places un peu éloignées ferait croire qu'il n'y en a pas.
 */
export const selectMappedListingsFromSearch = createSelector(
  [selectMappedListings, selectSearchPoint],
  (mapped, point): MappedListingWithDistance[] => {
    if (point === null)
      return mapped.map((entry) => ({ ...entry, distanceKm: null, nearby: false }));

    return mapped
      .map((entry) => ({
        ...entry,
        distanceKm: distanceInKilometers(point, entry.located.coordinates),
        nearby: isWithinWalkingDistance(point, entry.located.coordinates),
      }))
      .sort((left, right) => left.distanceKm - right.distanceKm);
  },
);

export const selectNearbyCount = createSelector(
  [selectMappedListingsFromSearch],
  (mapped) => mapped.filter((entry) => entry.nearby).length,
);

// Une adresse cherchée commande le cadrage : la carte va voir ce qu'on lui
// demande, et non plus le barycentre de toutes les annonces.
export const selectMapFocus = createSelector(
  [selectMappedListings, selectSearchPoint],
  (mapped, point): { center: Coordinates; zoom: number } =>
    point === null
      ? {
          center: centerOf(mapped.map((entry) => entry.located.coordinates)),
          zoom: zoomForSpan(spanInKilometers(mapped.map((entry) => entry.located.coordinates))),
        }
      : { center: point, zoom: CITY_ZOOM + 2 },
);

export interface VehicleTally {
  accepting: number;
  undeclared: number;
}

/**
 * Deux nombres et non un : combien de places acceptent explicitement ce
 * véhicule, et combien n'ont rien déclaré. Les secondes restent affichées —
 * l'absence d'information n'est pas un refus — mais le dire évite de laisser
 * croire que toutes ont été vérifiées.
 */
export const selectVehicleTally = createSelector(
  [selectListings, (_state: AppState, vehicle: VehicleType | null) => vehicle],
  (listings, vehicle): VehicleTally => {
    if (vehicle === null) return { accepting: 0, undeclared: 0 };
    return {
      accepting: listings.filter(
        (listing) =>
          declaresVehicles(listing.acceptedVehicles) &&
          acceptsVehicle(listing.acceptedVehicles, vehicle),
      ).length,
      undeclared: listings.filter((listing) => !declaresVehicles(listing.acceptedVehicles))
        .length,
    };
  },
);
