import { describe, it } from 'vitest';

import { createSearchFreeListingsSut } from './searchFreeListingsEpic.sut';

const OCTOBER_10_TO_12 = { from: '2026-10-10', to: '2026-10-12' };
const OCTOBER_20_TO_22 = { from: '2026-10-20', to: '2026-10-22' };

describe('searching the places free on a stay', () => {
  it('asks the api for the stay and shows only the free places, in the order of the list', () => {
    const sut = createSearchFreeListingsSut();
    sut.givenPublishedPlaces(['b12', 'b14', 'b16']);
    sut.givenTheApiFindsFree(['b16', 'b12']);

    sut.whenSearchingFor(OCTOBER_10_TO_12);

    sut.thenTheStaysAskedAre([OCTOBER_10_TO_12]);
    sut.thenThePlacesShownAre(['b12', 'b16']);
    sut.thenTheTallyIs({ free: 2, hidden: 1 });
    sut.thenTheSearchShows({ loading: false, error: null });
  });

  it('shows no place at all while the answer is on its way, rather than places that may be taken', () => {
    const sut = createSearchFreeListingsSut();
    sut.givenPublishedPlaces(['b12', 'b14']);
    sut.givenTheAnswerIsOnItsWay();

    sut.whenSearchingFor(OCTOBER_10_TO_12);

    sut.thenThePlacesShownAre([]);
    sut.thenTheTallyIs(null);
    sut.thenTheSearchShows({ loading: true, error: null });
  });

  it('shows every place again once the dates are dropped', () => {
    const sut = createSearchFreeListingsSut();
    sut.givenPublishedPlaces(['b12', 'b14']);
    sut.givenTheApiFindsFree(['b14']);
    sut.whenSearchingFor(OCTOBER_10_TO_12);

    sut.whenTheDatesAreDropped();

    sut.thenThePlacesShownAre(['b12', 'b14']);
    sut.thenTheTallyIs(null);
    sut.thenTheSearchShows({ loading: false, error: null });
  });

  it('ignores the answer to a stay that is no longer the one searched', () => {
    const sut = createSearchFreeListingsSut();
    sut.givenPublishedPlaces(['b12', 'b14']);
    sut.givenTheAnswerIsOnItsWay();
    sut.whenSearchingFor(OCTOBER_20_TO_22);

    sut.whenAnOlderAnswerArrives(OCTOBER_10_TO_12, ['b12', 'b14']);

    sut.thenThePlacesShownAre([]);
    sut.thenTheSearchShows({ loading: true, error: null });
  });

  it('shows the api refusal and no place', () => {
    const sut = createSearchFreeListingsSut();
    sut.givenPublishedPlaces(['b12']);
    sut.givenTheApiRefusesWith('Les dates recherchées sont invalides');

    sut.whenSearchingFor(OCTOBER_10_TO_12);

    sut.thenThePlacesShownAre([]);
    sut.thenTheSearchShows({ loading: false, error: 'Les dates recherchées sont invalides' });
  });
});
