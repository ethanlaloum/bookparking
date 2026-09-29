import {
  selectActiveListingCount,
  selectListingsError,
  selectSortedListings,
} from '../../../../../selectors/back-office/backOfficeSelectors';
import {
  anAdminListing,
  buildInMemoryDependencies,
  type InMemoryDependencies,
} from '../../../../../store/testing/InMemoryDependencies';
import { createTestStore } from '../../../../../store/testing/createTestStore';
import { hasNoPrice, type AdminListing } from '../../entities/AdminListing';
import { listListingsRequested } from './listListingsEpic';

export const createListListingsSut = () => {
  const dependencies: InMemoryDependencies = buildInMemoryDependencies();
  const store = createTestStore(dependencies);

  return {
    anAdminListing,

    givenTheApiHolds(listings: AdminListing[]): void {
      dependencies.backOfficeGateway.listings = listings;
    },
    givenTheApiRejectsWith(message: string): void {
      dependencies.backOfficeGateway.rejectWith('other', message);
    },
    whenListingListings(): void {
      store.dispatch(listListingsRequested());
    },
    thenTheListingsShownAre(count: number): void {
      const actual = selectSortedListings(store.getState()).length;
      if (actual !== count) throw new Error(`Annonces attendues ${count}, obtenues ${actual}`);
    },
    thenTheFirstShownIs(id: string): void {
      const actual = selectSortedListings(store.getState())[0]?.id ?? null;
      if (actual !== id)
        throw new Error(`Première annonce attendue "${id}", obtenue "${String(actual)}"`);
    },
    thenTheActiveCountIs(expected: number): void {
      const actual = selectActiveListingCount(store.getState());
      if (actual !== expected)
        throw new Error(`Annonces actives attendues ${expected}, obtenues ${actual}`);
    },
    thenThePricelessOnesAre(expected: number): void {
      const actual = selectSortedListings(store.getState()).filter(hasNoPrice).length;
      if (actual !== expected)
        throw new Error(`Annonces sans tarif attendues ${expected}, obtenues ${actual}`);
    },
    thenTheErrorShownIs(expected: string): void {
      const actual = selectListingsError(store.getState());
      if (actual !== expected)
        throw new Error(`Erreur attendue "${expected}", obtenue "${String(actual)}"`);
    },
  };
};
