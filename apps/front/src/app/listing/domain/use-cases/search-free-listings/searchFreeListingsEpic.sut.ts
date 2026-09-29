import { expect } from 'vitest';

import {
  selectFreeListingsError,
  selectFreeListingsLoading,
  selectListingsForStay,
  selectStayTally,
  type StayTally,
} from '../../../../../selectors/listing/listingSelectors';
import {
  aListing,
  buildInMemoryDependencies,
  type InMemoryDependencies,
} from '../../../../../store/testing/InMemoryDependencies';
import { createTestStore } from '../../../../../store/testing/createTestStore';
import type { SearchedStay } from '../../entities/SearchCriteria';
import { listListingsRequested } from '../list-listings/listListingsEpic';
import {
  freeListingsCleared,
  freeListingsRequested,
  freeListingsSucceeded,
} from './searchFreeListingsEpic';

export const createSearchFreeListingsSut = () => {
  const dependencies: InMemoryDependencies = buildInMemoryDependencies();
  const store = createTestStore(dependencies);

  return {
    givenPublishedPlaces(ids: string[]): void {
      dependencies.listingGateway.listings = ids.map((id) => aListing({ id, box: id }));
      store.dispatch(listListingsRequested());
    },
    givenTheApiFindsFree(ids: string[]): void {
      dependencies.listingGateway.freeListings = ids.map((id) => aListing({ id, box: id }));
    },
    givenTheApiRefusesWith(message: string): void {
      dependencies.listingGateway.freeRejection = message;
    },
    givenTheAnswerIsOnItsWay(): void {
      dependencies.listingGateway.freeResponseHeld = true;
    },
    whenSearchingFor(stay: SearchedStay): void {
      store.dispatch(freeListingsRequested(stay));
    },
    whenAnOlderAnswerArrives(stay: SearchedStay, ids: string[]): void {
      store.dispatch(freeListingsSucceeded({ stay, listingIds: ids }));
    },
    whenTheDatesAreDropped(): void {
      store.dispatch(freeListingsCleared());
    },
    thenTheStaysAskedAre(expected: SearchedStay[]): void {
      expect(dependencies.listingGateway.staysAsked).toEqual(expected);
    },
    thenThePlacesShownAre(expected: string[]): void {
      expect(selectListingsForStay(store.getState()).map((listing) => listing.id)).toEqual(expected);
    },
    thenTheTallyIs(expected: StayTally | null): void {
      expect(selectStayTally(store.getState())).toEqual(expected);
    },
    thenTheSearchShows(expected: { loading: boolean; error: string | null }): void {
      const state = store.getState();
      expect({
        loading: selectFreeListingsLoading(state),
        error: selectFreeListingsError(state),
      }).toEqual(expected);
    },
  };
};
