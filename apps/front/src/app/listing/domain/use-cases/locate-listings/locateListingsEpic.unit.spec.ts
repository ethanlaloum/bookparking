import { describe, it } from 'vitest';

import { createLocateListingsSut } from './locateListingsEpic.sut';

const BARLA = '12 rue Barla, 06300 Nice';
const MALAUSSENA = '3 avenue Malausséna, 06000 Nice';
const NULLE_PART = 'une adresse que personne ne connait';

describe('placing the listings on a map', () => {
  it('maps the listings the geocoder could place', () => {
    const sut = createLocateListingsSut();
    sut.givenListingsAt([BARLA, MALAUSSENA]);
    sut.givenTheGeocoderPlaces(BARLA, 43.7009, 7.2856);
    sut.givenTheGeocoderPlaces(MALAUSSENA, 43.7102, 7.2620);

    sut.whenLocating();

    sut.thenTheMappedListingsAre(2);
    sut.thenTheUnmappableCountIs(0);
  });

  it('keeps an address the geocoder could not place out of the map, without failing', () => {
    const sut = createLocateListingsSut();
    sut.givenListingsAt([BARLA, NULLE_PART]);
    sut.givenTheGeocoderPlaces(BARLA, 43.7009, 7.2856);

    sut.whenLocating();

    sut.thenTheMappedListingsAre(1);
    sut.thenTheUnmappableCountIs(1);
  });

  it('counts a listing the geocoder only matched approximately', () => {
    const sut = createLocateListingsSut();
    sut.givenListingsAt([BARLA, MALAUSSENA]);
    sut.givenTheGeocoderPlaces(BARLA, 43.7009, 7.2856, 'approximate');
    sut.givenTheGeocoderPlaces(MALAUSSENA, 43.7102, 7.2620);

    sut.whenLocating();

    sut.thenTheApproximateCountIs(1);
  });

  it('falls back on Nice when nothing could be placed', () => {
    const sut = createLocateListingsSut();
    sut.givenListingsAt([NULLE_PART]);

    sut.whenLocating();

    sut.thenTheMapFallsBackOnNice();
  });

  it('asks the geocoder once per address, and not again for one already placed', () => {
    const sut = createLocateListingsSut();
    sut.givenListingsAt([BARLA, MALAUSSENA]);
    sut.givenTheGeocoderPlaces(BARLA, 43.7009, 7.2856);
    sut.givenTheGeocoderPlaces(MALAUSSENA, 43.7102, 7.2620);

    sut.whenLocating();
    sut.whenLocating();

    sut.thenTheGeocoderWasAskedTimes(2);
  });
});
