import { describe, it } from 'vitest';

import { createListListingsSut } from './listListingsEpic.sut';

const AUCUN_TARIF = { dayInCents: null, weekInCents: null, monthInCents: null };

describe('la liste des annonces', () => {
  it('montre la plus récemment publiée en premier et compte les actives', () => {
    const sut = createListListingsSut();
    sut.givenTheApiHolds([
      sut.anAdminListing({ id: 'ancienne', publishedAt: '2026-01-01T00:00:00.000Z' }),
      sut.anAdminListing({ id: 'recente', publishedAt: '2026-09-01T00:00:00.000Z' }),
      sut.anAdminListing({
        id: 'retiree',
        status: 'UNPUBLISHED',
        publishedAt: '2026-02-01T00:00:00.000Z',
      }),
    ]);

    sut.whenListingListings();

    sut.thenTheListingsShownAre(3);
    sut.thenTheFirstShownIs('recente');
    sut.thenTheActiveCountIs(2);
  });

  it("ne compte comme « sans tarif » qu'une annonce encore active", () => {
    const sut = createListListingsSut();
    sut.givenTheApiHolds([
      sut.anAdminListing({ id: 'active-sans-tarif', pricing: AUCUN_TARIF }),
      sut.anAdminListing({
        id: 'retiree-sans-tarif',
        status: 'UNPUBLISHED',
        pricing: AUCUN_TARIF,
      }),
      sut.anAdminListing({ id: 'active-tarifee' }),
    ]);

    sut.whenListingListings();

    sut.thenThePricelessOnesAre(1);
  });

  it("montre le message de l'api quand la liste est illisible", () => {
    const sut = createListListingsSut();
    sut.givenTheApiRejectsWith('La liste des annonces est indisponible');

    sut.whenListingListings();

    sut.thenTheErrorShownIs('La liste des annonces est indisponible');
  });
});
