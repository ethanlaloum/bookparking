import { afterEach, beforeEach, describe, it, vi } from 'vitest';

import { createSearchAddressSut } from './searchAddressEpic.sut';

const MASSENA = {
  id: 'ban-massena',
  label: 'Place Masséna 06000 Nice',
  coordinates: { latitude: 43.6975, longitude: 7.2707 },
};
const GAMBETTA = {
  id: 'ban-gambetta',
  label: 'Boulevard Gambetta 06000 Nice',
  coordinates: { latitude: 43.6989, longitude: 7.2564 },
};

// À deux pas de Masséna, et à l'autre bout de la ville.
const JARDIN = { address: 'jardin Albert 1er', latitude: 43.6958, longitude: 7.2688 };
const CIMIEZ = { address: 'avenue de Cimiez', latitude: 43.7211, longitude: 7.2761 };

const advance = async (ms: number): Promise<void> => {
  await vi.advanceTimersByTimeAsync(ms);
};

describe('searching an address on the map', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('suggests the addresses the geocoder returns', async () => {
    const sut = createSearchAddressSut(advance);
    sut.givenTheGeocoderSuggests('place mass', [MASSENA]);

    await sut.whenTyping('place mass');

    sut.thenTheSuggestionsAre([MASSENA.label]);
  });

  it('suggests nothing below three characters, and asks the geocoder nothing', async () => {
    const sut = createSearchAddressSut(advance);

    await sut.whenTyping('pl');

    sut.thenTheSuggestionsAre([]);
    sut.thenTheGeocoderWasQueriedWith([]);
  });

  it('queries the geocoder once for a burst of keystrokes, on the last one', async () => {
    const sut = createSearchAddressSut(advance);
    sut.givenTheGeocoderSuggests('place mass', [MASSENA]);

    await sut.whenTypingWithoutPausing(['pla', 'plac', 'place', 'place mass']);

    sut.thenTheGeocoderWasQueriedWith(['place mass']);
    sut.thenTheSuggestionsAre([MASSENA.label]);
  });

  it('centres the map on the address that was picked', () => {
    const sut = createSearchAddressSut(advance);
    sut.whenSelecting(MASSENA);

    sut.thenTheSearchLabelIs(MASSENA.label);
    sut.thenTheMapIsCenteredOn(MASSENA.coordinates.latitude, MASSENA.coordinates.longitude);
  });

  it('orders the places by distance from the picked address, keeping them all', () => {
    const sut = createSearchAddressSut(advance);
    sut.givenListingsPlacedAt([CIMIEZ, JARDIN]);

    sut.whenSelecting(MASSENA);

    sut.thenTheListingsInOrderAre([JARDIN.address, CIMIEZ.address]);
  });

  it('counts only the places within a kilometre as nearby', () => {
    const sut = createSearchAddressSut(advance);
    sut.givenListingsPlacedAt([CIMIEZ, JARDIN]);

    sut.whenSelecting(MASSENA);

    sut.thenTheNearbyCountIs(1);
  });

  it('forgets the search once it is cleared', () => {
    const sut = createSearchAddressSut(advance);
    sut.whenSelecting(GAMBETTA);

    sut.whenClearing();

    sut.thenTheSearchLabelIs(null);
    sut.thenTheSuggestionsAre([]);
  });
});
