import {
  aListing,
  buildInMemoryDependencies,
  type InMemoryDependencies,
} from '../../../../../store/testing/InMemoryDependencies';
import { createTestStore } from '../../../../../store/testing/createTestStore';
import {
  selectApproximateCount,
  selectMapFocus,
  selectMappedListings,
  selectUnmappableCount,
} from '../../../../../selectors/listing/listingSelectors';
import { COUNTRY_ZOOM, FRANCE, type LocationPrecision } from '../../entities/Coordinates';
import { listListingsRequested } from '../list-listings/listListingsEpic';
import { locateListingsRequested } from './locateListingsEpic';

export const createLocateListingsSut = () => {
  const dependencies: InMemoryDependencies = buildInMemoryDependencies();
  const store = createTestStore(dependencies);

  return {
    givenListingsAt(addresses: string[]): void {
      dependencies.listingGateway.listings = addresses.map((address, index) =>
        aListing({ id: `annonce-${String(index)}`, address }),
      );
      store.dispatch(listListingsRequested());
    },
    givenTheGeocoderPlaces(
      address: string,
      latitude: number,
      longitude: number,
      precision: LocationPrecision = 'exact',
    ): void {
      dependencies.geocodingGateway.locatedByAddress.set(address, {
        coordinates: { latitude, longitude },
        precision,
        matchedLabel: address,
      });
    },
    whenLocating(): void {
      store.dispatch(locateListingsRequested());
    },
    thenTheMappedListingsAre(count: number): void {
      const actual = selectMappedListings(store.getState()).length;
      if (actual !== count) throw new Error(`Annonces placées attendues ${count}, obtenues ${actual}`);
    },
    thenTheUnmappableCountIs(count: number): void {
      const actual = selectUnmappableCount(store.getState());
      if (actual !== count) throw new Error(`Non plaçables attendues ${count}, obtenues ${actual}`);
    },
    thenTheApproximateCountIs(count: number): void {
      const actual = selectApproximateCount(store.getState());
      if (actual !== count) throw new Error(`Approximatives attendues ${count}, obtenues ${actual}`);
    },
    thenTheMapOpensOnFrance(): void {
      const { center, zoom } = selectMapFocus(store.getState());
      if (
        center.latitude !== FRANCE.latitude ||
        center.longitude !== FRANCE.longitude ||
        zoom !== COUNTRY_ZOOM
      )
        throw new Error(
          `Repli attendu sur la France entière, obtenu ${JSON.stringify({ center, zoom })}`,
        );
    },
    thenTheGeocoderWasAskedTimes(count: number): void {
      const actual = dependencies.geocodingGateway.asked.length;
      if (actual !== count) throw new Error(`Appels attendus ${count}, obtenus ${actual}`);
    },
  };
};
