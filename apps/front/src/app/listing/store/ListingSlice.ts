import { createReducer } from '@reduxjs/toolkit';

import { logoutSucceeded } from '../../auth/domain/use-cases/sign-out/signOutEpic';
import { initialCommonState, type CommonState } from '../../../store/CommonState';
import type { Listing } from '../domain/entities/Listing';
import type { OwnerListing } from '../domain/ports/ListingGateway';
import {
  getListingFailed,
  getListingRequested,
  getListingSucceeded,
  resetGetListingState,
} from '../domain/use-cases/get-listing/getListingEpic';
import {
  listOwnerListingsFailed,
  listOwnerListingsRequested,
  listOwnerListingsSucceeded,
} from '../domain/use-cases/list-owner-listings/listOwnerListingsEpic';
import {
  listListingsFailed,
  listListingsRequested,
  listListingsSucceeded,
} from '../domain/use-cases/list-listings/listListingsEpic';
import {
  publishListingFailed,
  publishListingRequested,
  publishListingSucceeded,
  resetPublishListingState,
} from '../domain/use-cases/publish-listing/publishListingEpic';
import {
  resetUnpublishListingState,
  unpublishListingFailed,
  unpublishListingRequested,
  unpublishListingSucceeded,
} from '../domain/use-cases/unpublish-listing/unpublishListingEpic';
import {
  resetUpdateListingPricingState,
  updateListingPricingFailed,
  updateListingPricingRequested,
  updateListingPricingSucceeded,
} from '../domain/use-cases/update-listing-pricing/updateListingPricingEpic';

export interface ListingState {
  listings: Listing[];
  ownerListings: OwnerListing[];
  selected: Listing | null;
  list: CommonState;
  listOwner: CommonState;
  get: CommonState;
  publish: CommonState;
  unpublish: CommonState;
  updatePricing: CommonState;
}

const initialState: ListingState = {
  listings: [],
  ownerListings: [],
  selected: null,
  list: initialCommonState,
  listOwner: initialCommonState,
  get: initialCommonState,
  publish: initialCommonState,
  unpublish: initialCommonState,
  updatePricing: initialCommonState,
};

export const listingReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(listListingsRequested, (state) => {
      state.list = { state: 'pending' };
    })
    .addCase(listListingsSucceeded, (state, action) => {
      state.list = { state: 'succeeded' };
      state.listings = action.payload;
    })
    .addCase(listListingsFailed, (state, action) => {
      state.list = { state: 'failed', errorCode: action.payload.errorCode };
    })
    .addCase(listOwnerListingsRequested, (state) => {
      state.listOwner = { state: 'pending' };
    })
    .addCase(listOwnerListingsSucceeded, (state, action) => {
      state.listOwner = { state: 'succeeded' };
      state.ownerListings = action.payload;
    })
    .addCase(listOwnerListingsFailed, (state, action) => {
      state.listOwner = { state: 'failed', errorCode: action.payload.errorCode };
    })
    .addCase(getListingRequested, (state) => {
      state.get = { state: 'pending' };
      state.selected = null;
    })
    .addCase(getListingSucceeded, (state, action) => {
      state.get = { state: 'succeeded' };
      state.selected = action.payload;
    })
    .addCase(getListingFailed, (state, action) => {
      state.get = { state: 'failed', errorCode: action.payload.errorCode };
    })
    .addCase(resetGetListingState, (state) => {
      state.get = initialCommonState;
      state.selected = null;
    })
    .addCase(publishListingRequested, (state) => {
      state.publish = { state: 'pending' };
    })
    .addCase(publishListingSucceeded, (state) => {
      state.publish = { state: 'succeeded' };
    })
    .addCase(publishListingFailed, (state, action) => {
      state.publish = { state: 'failed', errorCode: action.payload.errorCode };
    })
    .addCase(resetPublishListingState, (state) => {
      state.publish = initialCommonState;
    })
    .addCase(unpublishListingRequested, (state) => {
      state.unpublish = { state: 'pending' };
    })
    .addCase(unpublishListingSucceeded, (state, action) => {
      state.unpublish = { state: 'succeeded' };
      state.listings = state.listings.filter((listing) => listing.id !== action.payload.id);
      state.ownerListings = state.ownerListings.map((listing) =>
        listing.id === action.payload.id ? { ...listing, status: 'UNPUBLISHED' } : listing,
      );
      if (state.selected?.id === action.payload.id) state.selected = null;
    })
    .addCase(unpublishListingFailed, (state, action) => {
      state.unpublish = { state: 'failed', errorCode: action.payload.errorCode };
    })
    .addCase(resetUnpublishListingState, (state) => {
      state.unpublish = initialCommonState;
    })
    .addCase(updateListingPricingRequested, (state) => {
      state.updatePricing = { state: 'pending' };
    })
    .addCase(updateListingPricingSucceeded, (state, action) => {
      state.updatePricing = { state: 'succeeded' };
      state.selected = action.payload;
      state.listings = state.listings.map((listing) =>
        listing.id === action.payload.id ? action.payload : listing,
      );
    })
    .addCase(updateListingPricingFailed, (state, action) => {
      state.updatePricing = { state: 'failed', errorCode: action.payload.errorCode };
    })
    .addCase(resetUpdateListingPricingState, (state) => {
      state.updatePricing = initialCommonState;
    })
    .addCase(logoutSucceeded, (state) => ({ ...initialState, listings: state.listings }));
});
