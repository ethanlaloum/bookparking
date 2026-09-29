// Couvert ici : qu'une annonce publiée atteigne la carte, y soit placée au bon
// endroit, et ramène vers sa fiche. C'est le seul barreau où le géocodage, le
// rendu Leaflet et le routage se voient ensemble.
//
// Ce parcours dépend d'un tiers réel, la Base Adresse Nationale. Elle est
// joignable sans clé et fait autorité sur les adresses françaises, donc
// l'exemple reste un exemple e2e au sens du §1 : rien n'est simulé. La
// contrepartie est assumée — si la BAN est indisponible, ce test échoue, et
// c'est correct : la fonctionnalité l'est aussi.
//
// Sans équivalent ici, et pourquoi :
// - le cadrage, le repli sur Nice et la règle de précision : fonctions pures,
//   déjà vertes au rung `unit` du front.
// - une adresse hors de Nice refusée par le filtre `citycode` : le vérifier ici
//   demanderait de publier une annonce que le produit ne veut pas, pour
//   observer une absence. Le rung `unit` le prouve sur le double.
import { expect, test } from '../../../src/fixtures/test';
import { SearchPage } from '../../../src/pages/SearchPage';

test.describe('Map', () => {
  test('places a published listing on the map and leads back to its page', async ({
    page,
    seed,
  }) => {
    const owner = await seed.user('map-owner');
    const listing = await seed.listing(owner, { address: '12 rue Barla, 06300 Nice' });

    const map = new SearchPage(page);
    await map.open();
    await map.expectMapVisible();

    await map.openPopupFor(listing.address);
    await map.expectPopupShows(listing.address);
    await map.expectPopupShows(listing.box);

    await map.followListingFromPopup();
    await expect(page).toHaveURL(new RegExp(`/place/${listing.id}$`));
  });

  test('searches an address, centres on it and ranks the places by distance', async ({
    page,
    seed,
  }) => {
    const owner = await seed.user('map-search-owner');
    const listing = await seed.listing(owner, { address: '4 place Masséna, 06000 Nice' });

    const map = new SearchPage(page);
    await map.open();
    await expect(map.marker(listing.address)).toBeVisible();

    await map.searchAddress('place mass', 'Place Masséna 06000 Nice');

    await map.expectSearchSummary(/Autour de : Place Masséna/);
    await map.expectSearchSummary(/à moins d.un kilomètre/);

    await map.abandonSearch();
    await expect(page.getByText(/Autour de/)).toHaveCount(0);
  });
});
