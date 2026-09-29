import {
  aListing,
  buildInMemoryDependencies,
  type InMemoryDependencies,
} from '../../../../../store/testing/InMemoryDependencies';
import { createTestStore } from '../../../../../store/testing/createTestStore';
import {
  selectAddressSuggestions,
  selectMapFocus,
  selectMappedListingsFromSearch,
  selectNearbyCount,
  selectSearchLabel,
} from '../../../../../selectors/listing/listingSelectors';
import type { AddressSuggestion } from '../../entities/Coordinates';
import { listListingsRequested } from '../list-listings/listListingsEpic';
import { locateListingsRequested } from '../locate-listings/locateListingsEpic';
import {
  addressQueryChanged,
  addressSearchCleared,
  addressSelected,
} from './searchAddressEpic';

// Le debounce de l'epic est de 250 ms : les tests avancent le temps plutôt que
// de l'attendre, et `vi.useFakeTimers` est armé par la spec, pas par le SUT.
export const createSearchAddressSut = (advance: (ms: number) => Promise<void>) => {
  const dependencies: InMemoryDependencies = buildInMemoryDependencies();
  const store = createTestStore(dependencies);

  return {
    givenTheGeocoderSuggests(query: string, suggestions: AddressSuggestion[]): void {
      dependencies.geocodingGateway.suggestionsByQuery.set(query, suggestions);
    },
    givenListingsPlacedAt(
      entries: { address: string; latitude: number; longitude: number }[],
    ): void {
      dependencies.listingGateway.listings = entries.map((entry, index) =>
        aListing({ id: `annonce-${String(index)}`, address: entry.address }),
      );
      for (const entry of entries)
        dependencies.geocodingGateway.locatedByAddress.set(entry.address, {
          coordinates: { latitude: entry.latitude, longitude: entry.longitude },
          precision: 'exact',
          matchedLabel: entry.address,
        });
      store.dispatch(listListingsRequested());
      store.dispatch(locateListingsRequested());
    },
    async whenTyping(query: string): Promise<void> {
      store.dispatch(addressQueryChanged({ query }));
      await advance(300);
    },
    async whenTypingWithoutPausing(queries: string[]): Promise<void> {
      for (const query of queries) {
        store.dispatch(addressQueryChanged({ query }));
        await advance(80);
      }
      await advance(300);
    },
    whenSelecting(suggestion: AddressSuggestion): void {
      store.dispatch(addressSelected(suggestion));
    },
    whenClearing(): void {
      store.dispatch(addressSearchCleared());
    },
    thenTheSuggestionsAre(labels: string[]): void {
      const actual = selectAddressSuggestions(store.getState()).map((s) => s.label);
      if (JSON.stringify(actual) !== JSON.stringify(labels))
        throw new Error(`Suggestions attendues ${JSON.stringify(labels)}, obtenues ${JSON.stringify(actual)}`);
    },
    thenTheGeocoderWasQueriedWith(queries: string[]): void {
      const actual = dependencies.geocodingGateway.queried;
      if (JSON.stringify(actual) !== JSON.stringify(queries))
        throw new Error(`Requêtes attendues ${JSON.stringify(queries)}, obtenues ${JSON.stringify(actual)}`);
    },
    thenTheSearchLabelIs(expected: string | null): void {
      const actual = selectSearchLabel(store.getState());
      if (actual !== expected)
        throw new Error(`Libellé attendu ${String(expected)}, obtenu ${String(actual)}`);
    },
    thenTheListingsInOrderAre(addresses: string[]): void {
      const actual = selectMappedListingsFromSearch(store.getState()).map(
        (entry) => entry.listing.address,
      );
      if (JSON.stringify(actual) !== JSON.stringify(addresses))
        throw new Error(`Ordre attendu ${JSON.stringify(addresses)}, obtenu ${JSON.stringify(actual)}`);
    },
    thenTheNearbyCountIs(expected: number): void {
      const actual = selectNearbyCount(store.getState());
      if (actual !== expected)
        throw new Error(`Places proches attendues ${expected}, obtenues ${actual}`);
    },
    thenTheMapIsCenteredOn(latitude: number, longitude: number): void {
      const { center } = selectMapFocus(store.getState());
      if (center.latitude !== latitude || center.longitude !== longitude)
        throw new Error(`Centre attendu ${latitude},${longitude}, obtenu ${JSON.stringify(center)}`);
    },
  };
};
