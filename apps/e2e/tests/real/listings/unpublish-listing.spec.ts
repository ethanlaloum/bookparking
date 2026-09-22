// Couvert ici : deux choses qu'aucun rung inferieur ne voit ensemble. D'abord
// qu'un proprietaire depublie depuis la fiche et que l'annonce quitte la grille
// publique. Ensuite qu'un autre compte connecte, a qui l'ecran propose la meme
// action faute d'`ownerId` dans le DTO, se fasse refuser par l'api — c'est le
// seul endroit ou l'on verifie que l'autorite reste cote serveur.
//
// Sans equivalent ici, et pourquoi :
// - l'idempotence (identifiant inconnu ou mal forme repondant 204) : rung
//   `int-http` cote api ; le navigateur ne verrait qu'une page inchangee.
import { test } from '../../../src/fixtures/test';
import { ListingDetailPage } from '../../../src/pages/ListingDetailPage';
import { ListingsPage } from '../../../src/pages/ListingsPage';

test.describe('Listings', () => {
  test('unpublishes an owned listing and removes it from the grid', async ({ page, seed, app }) => {
    const owner = await seed.user('unpublish');
    const listing = await seed.listing(owner);

    await app.openAs(owner);
    await page.goto(`/place/${listing.id}`);

    const detail = new ListingDetailPage(page);
    await detail.expectOpen(listing.address);
    await detail.unpublish();

    const listings = new ListingsPage(page);
    await listings.open();
    await listings.expectNotListed(listing.address);
  });

  test('refuses to unpublish a listing owned by someone else', async ({ page, seed, app }) => {
    const owner = await seed.user('owner');
    const intruder = await seed.user('intruder');
    const listing = await seed.listing(owner);

    await app.openAs(intruder);
    await page.goto(`/place/${listing.id}`);

    const detail = new ListingDetailPage(page);
    await detail.expectOpen(listing.address);
    await detail.unpublish();
    await detail.expectNotOwnedRefusal();
  });
});
