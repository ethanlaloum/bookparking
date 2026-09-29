import { createSelector } from '@reduxjs/toolkit';

import {
  cheapestNightlyRateInCents,
  type Listing,
} from '../../app/listing/domain/entities/Listing';
import {
  CITY_ZOOM,
  distanceInKilometers,
  frameOf,
  isWithinWalkingDistance,
  type AddressSuggestion,
  type Coordinates,
  type LocatedAddress,
  type MapFrame,
} from '../../app/listing/domain/entities/Coordinates';
import {
  acceptsVehicle,
  declaresVehicles,
  type SearchedStay,
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

export const selectEditListingLoading = (state: AppState): boolean =>
  state.core.listing.edit.state === 'pending';

export const selectEditListingError = (state: AppState): string | null =>
  state.core.listing.edit.state === 'failed' ? (state.core.listing.edit.errorCode ?? null) : null;

export const selectEditListingSuccess = (state: AppState): boolean =>
  state.core.listing.edit.state === 'succeeded';

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

export const selectEditableOwnerListing = (state: AppState, id: string): OwnerListing | null =>
  state.core.listing.ownerListings.find(
    (listing) => listing.id === id && listing.status === 'ACTIVE',
  ) ?? null;

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

export const selectSearchedStay = (state: AppState): SearchedStay | null =>
  state.core.listing.freeStay;

const selectFreeListingIds = (state: AppState): string[] | null =>
  state.core.listing.freeListingIds;

export const selectFreeListingsLoading = (state: AppState): boolean =>
  state.core.listing.searchFree.state === 'pending';

export const selectFreeListingsError = (state: AppState): string | null =>
  state.core.listing.searchFree.state === 'failed'
    ? (state.core.listing.searchFree.errorCode ?? null)
    : null;

export const selectListingsForStay = createSelector(
  [selectListings, selectSearchedStay, selectFreeListingIds],
  (listings, stay, freeIds): Listing[] => {
    if (stay === null) return listings;
    if (freeIds === null) return [];
    const free = new Set(freeIds);
    return listings.filter((listing) => free.has(listing.id));
  },
);

export interface StayTally {
  free: number;
  hidden: number;
}

export const selectStayTally = createSelector(
  [selectListings, selectListingsForStay, selectFreeListingIds],
  (listings, forStay, freeIds): StayTally | null =>
    freeIds === null ? null : { free: forStay.length, hidden: listings.length - forStay.length },
);

export const selectMappedListings = createSelector(
  [selectListingsForStay, selectLocations],
  (listings, locations): MappedListing[] =>
    listings
      .map((listing) => ({ listing, located: locations[listing.id] }))
      .filter((entry): entry is MappedListing => entry.located !== undefined),
);

export const selectUnmappableCount = createSelector(
  [selectListingsForStay, selectLocations],
  (listings, locations) =>
    listings.filter((listing) => locations[listing.id] === undefined).length,
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
  (mapped, point): MapFrame =>
    point === null
      ? frameOf(mapped.map((entry) => entry.located.coordinates))
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
  [selectListingsForStay, (_state: AppState, vehicle: VehicleType | null) => vehicle],
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
