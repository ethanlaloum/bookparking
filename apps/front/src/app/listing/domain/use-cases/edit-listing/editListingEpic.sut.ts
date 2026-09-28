import { expect } from 'vitest';

import {
  selectEditableOwnerListing,
  selectEditListingError,
  selectEditListingLoading,
  selectEditListingSuccess,
  selectListings,
  selectOwnerListings,
  selectSelectedListing,
} from '../../../../../selectors/listing/listingSelectors';
import {
  buildInMemoryDependencies,
  type InMemoryDependencies,
} from '../../../../../store/testing/InMemoryDependencies';
import { createTestStore } from '../../../../../store/testing/createTestStore';
import type { Listing } from '../../entities/Listing';
import {
  storedPhotoDraftsOf,
  type ListingContentDraft,
  type LocalPhoto,
} from '../../entities/ListingPhoto';
import type { EditListingPayload, OwnerListing } from '../../ports/ListingGateway';
import { getListingSucceeded } from '../get-listing/getListingEpic';
import { listListingsSucceeded } from '../list-listings/listListingsEpic';
import { listOwnerListingsSucceeded } from '../list-owner-listings/listOwnerListingsEpic';
import { editListingRequested, resetEditListingState } from './editListingEpic';

export const createEditListingSut = () => {
  const dependencies: InMemoryDependencies = buildInMemoryDependencies();
  const store = createTestStore(dependencies);

  return {
    givenTheOwnerListings(listings: OwnerListing[]): void {
      dependencies.listingGateway.ownerListings = listings;
      store.dispatch(listOwnerListingsSucceeded(listings));
    },
    givenThePublicListings(listings: Listing[]): void {
      store.dispatch(listListingsSucceeded(listings));
    },
    givenTheOpenedListing(listing: Listing): void {
      store.dispatch(getListingSucceeded(listing));
    },
    givenTheApiRejectsWith(message: string): void {
      dependencies.listingGateway.rejection = message;
    },
    givenThePhotoUploadsAreRefusedWith(message: string): void {
      dependencies.listingGateway.uploadRejection = message;
    },
    whenEditing(id: string, listing: EditListingPayload): void {
      store.dispatch(
        editListingRequested({ id, listing: { ...listing, photos: storedPhotoDraftsOf(listing.photos) } }),
      );
    },
    whenEditingWithPhotos(id: string, listing: ListingContentDraft): void {
      store.dispatch(editListingRequested({ id, listing }));
    },
    thenTheUploadedPhotosAre(expected: LocalPhoto[]): void {
      expect(dependencies.listingGateway.uploadedPhotos).toEqual(expected);
    },
    whenLeavingTheForm(): void {
      store.dispatch(resetEditListingState());
    },
    thenTheEditsSentAre(expected: { id: string; listing: EditListingPayload }[]): void {
      expect(dependencies.listingGateway.edited).toEqual(expected);
    },
    thenTheScreenShows(expected: { loading: boolean; error: string | null; saved: boolean }): void {
      const state = store.getState();
      expect({
        loading: selectEditListingLoading(state),
        error: selectEditListingError(state),
        saved: selectEditListingSuccess(state),
      }).toEqual(expected);
    },
    thenTheOwnerListingsAre(expected: OwnerListing[]): void {
      expect(selectOwnerListings(store.getState())).toEqual(expected);
    },
    thenThePublicListingsAre(expected: Listing[]): void {
      expect(selectListings(store.getState())).toEqual(expected);
    },
    thenTheOpenedListingIs(expected: Listing | null): void {
      expect(selectSelectedListing(store.getState())).toEqual(expected);
    },
    thenTheEditableListingIs(id: string, expected: OwnerListing | null): void {
      expect(selectEditableOwnerListing(store.getState(), id)).toEqual(expected);
    },
  };
};
