import { createSelector } from '@reduxjs/toolkit';

import {
  cheapestNightlyRateInCents,
  isListingAvailableOn,
  type Listing,
} from '../../app/listing/domain/entities/Listing';
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

export interface ListingFilters {
  query: string;
  fromDay: string;
  toDay: string;
}

export const selectMatchingListings = createSelector(
  [selectListings, (_state: AppState, filters: ListingFilters) => filters],
  (listings, filters): Listing[] => {
    const needle = filters.query.trim().toLocaleLowerCase('fr-FR');
    return listings.filter((listing) => {
      const haystack = `${listing.address} ${listing.box}`.toLocaleLowerCase('fr-FR');
      if (needle !== '' && !haystack.includes(needle)) return false;
      if (filters.fromDay !== '' && filters.toDay !== '')
        return isListingAvailableOn(listing, filters.fromDay, filters.toDay);
      return true;
    });
  },
);

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
