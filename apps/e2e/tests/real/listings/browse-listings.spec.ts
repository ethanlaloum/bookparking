// Couvert ici : qu'une annonce publiee par l'api atteigne la grille publique et
// sa fiche, sans authentification. C'est le parcours du visiteur, et le seul
// endroit ou la chaine navigateur -> front -> api -> base est verifiee en
// lecture.
//
// Sans equivalent ici, et pourquoi :
// - le filtrage par periode : c'est une fonction pure du domaine
//   (isListingAvailableOn), deja verte au rung `unit`.
// - l'annonce introuvable (404) : rung `unit` sur l'epic, et `int-http` cote api.
import { test } from '../../../src/fixtures/test';
import { ListingDetailPage } from '../../../src/pages/ListingDetailPage';
import { SearchPage } from '../../../src/pages/SearchPage';

test.describe('Listings', () => {
  test('shows a published listing to an anonymous visitor and opens its page', async ({
    page,
    seed,
  }) => {
    const owner = await seed.user('browse');
    const listing = await seed.listing(owner);

    const search = new SearchPage(page);
    await search.open();
    await search.expectListed(listing.address);

    await search.openListingFromList(listing.address);
    await new ListingDetailPage(page).expectOpen(listing.address);
  });
});
