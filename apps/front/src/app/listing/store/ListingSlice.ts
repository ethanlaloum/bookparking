import { createReducer } from '@reduxjs/toolkit';

import { logoutSucceeded } from '../../auth/domain/use-cases/sign-out/signOutEpic';
import { initialCommonState, type CommonState } from '../../../store/CommonState';
import { publicListingOf, type Listing } from '../domain/entities/Listing';
import type { AddressSuggestion, Coordinates, LocatedAddress } from '../domain/entities/Coordinates';
import {
  addressSearchCleared,
  addressSelected,
  addressSuggestionsReceived,
} from '../domain/use-cases/search-address/searchAddressEpic';
import type { OwnerListing } from '../domain/ports/ListingGateway';
import { isSameStay, type SearchedStay } from '../domain/entities/SearchCriteria';
import {
  freeListingsCleared,
  freeListingsFailed,
  freeListingsRequested,
  freeListingsSucceeded,
} from '../domain/use-cases/search-free-listings/searchFreeListingsEpic';
import {
  locateListingsRequested,
  locateListingsSucceeded,
} from '../domain/use-cases/locate-listings/locateListingsEpic';
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
  editListingFailed,
  editListingRequested,
  editListingSucceeded,
  resetEditListingState,
} from '../domain/use-cases/edit-listing/editListingEpic';

export interface ListingState {
  listings: Listing[];
  ownerListings: OwnerListing[];
  locations: Record<string, LocatedAddress>;
  suggestions: AddressSuggestion[];
  searchPoint: Coordinates | null;
  searchLabel: string | null;
  freeStay: SearchedStay | null;
  freeListingIds: string[] | null;
  selected: Listing | null;
  list: CommonState;
  searchFree: CommonState;
  listOwner: CommonState;
  locate: CommonState;
  get: CommonState;
  publish: CommonState;
  unpublish: CommonState;
  edit: CommonState;
}

const initialState: ListingState = {
  listings: [],
  ownerListings: [],
  locations: {},
  suggestions: [],
  searchPoint: null,
  searchLabel: null,
  freeStay: null,
  freeListingIds: null,
  selected: null,
  list: initialCommonState,
  searchFree: initialCommonState,
  listOwner: initialCommonState,
  locate: initialCommonState,
  get: initialCommonState,
  publish: initialCommonState,
  unpublish: initialCommonState,
  edit: initialCommonState,
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
    .addCase(locateListingsRequested, (state) => {
      state.locate = { state: 'pending' };
    })
    .addCase(locateListingsSucceeded, (state, action) => {
      state.locate = { state: 'succeeded' };
      for (const { listingId, located } of action.payload) state.locations[listingId] = located;
    })
    .addCase(addressSuggestionsReceived, (state, action) => {
      state.suggestions = action.payload;
    })
    .addCase(addressSelected, (state, action) => {
      state.searchPoint = action.payload.coordinates;
      state.searchLabel = action.payload.label;
      state.suggestions = [];
    })
    .addCase(addressSearchCleared, (state) => {
      state.suggestions = [];
      state.searchPoint = null;
      state.searchLabel = null;
    })
    .addCase(freeListingsRequested, (state, action) => {
      state.freeStay = action.payload;
      state.freeListingIds = null;
      state.searchFree = { state: 'pending' };
    })
    .addCase(freeListingsSucceeded, (state, action) => {
      if (!isSameStay(state.freeStay, action.payload.stay)) return;
      state.freeListingIds = action.payload.listingIds;
      state.searchFree = { state: 'succeeded' };
    })
    .addCase(freeListingsFailed, (state, action) => {
      if (!isSameStay(state.freeStay, action.payload.stay)) return;
      state.searchFree = { state: 'failed', errorCode: action.payload.errorCode };
    })
    .addCase(freeListingsCleared, (state) => {
      state.freeStay = null;
      state.freeListingIds = null;
      state.searchFree = initialCommonState;
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
    .addCase(editListingRequested, (state) => {
      state.edit = { state: 'pending' };
    })
    .addCase(editListingSucceeded, (state, action) => {
      const edited = publicListingOf(action.payload);
      state.edit = { state: 'succeeded' };
      state.ownerListings = state.ownerListings.map((listing) =>
        listing.id === action.payload.id ? action.payload : listing,
      );
      state.listings = state.listings.map((listing) =>
        listing.id === edited.id ? edited : listing,
      );
      if (state.selected?.id === edited.id) state.selected = edited;
    })
    .addCase(editListingFailed, (state, action) => {
      state.edit = { state: 'failed', errorCode: action.payload.errorCode };
    })
    .addCase(resetEditListingState, (state) => {
      state.edit = initialCommonState;
    })
    .addCase(logoutSucceeded, (state) => ({
      ...initialState,
      listings: state.listings,
      freeStay: state.freeStay,
      freeListingIds: state.freeListingIds,
      searchFree: state.searchFree,
    }));
});
