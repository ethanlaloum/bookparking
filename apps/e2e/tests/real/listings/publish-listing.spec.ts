// Couvert ici : publier depuis l'ecran, puis retrouver l'annonce dans la grille.
// Ce parcours existe precisement parce que `POST /listing` repond 201 sans
// corps : le front ne connait pas l'identifiant cree et doit relire
// `GET /listing`. Aucun rung inferieur ne peut observer que cette relecture a
// bien lieu et que l'annonce y figure.
//
// Sans equivalent ici, et pourquoi :
// - les refus de publication (place deja active, periode passee, grille
//   incomplete) : tous verts au rung `unit` cote api, et leur affichage cote
//   front est un rendu, pas un cablage.
// - l'echec du stockage des photos (502) : aucun stockage reel n'est monte dans
//   cette pile, donc l'exemple n'est pas un exemple e2e.
import { test } from '../../../src/fixtures/test';
import { HeaderNav } from '../../../src/pages/HeaderNav';
import { ListingsPage } from '../../../src/pages/ListingsPage';
import { PublishPage } from '../../../src/pages/PublishPage';
import { dayInDays, uniqueAddress } from '../../../src/seed/Seeder';

test.describe('Listings', () => {
  test('publishes a listing and finds it back in the grid', async ({ page, seed, app }) => {
    const owner = await seed.user('publish');
    await app.openAs(owner);
    await new HeaderNav(page).expectSignedIn();

    const address = uniqueAddress();
    const publish = new PublishPage(page);
    await publish.open();
    await publish.fill({
      address,
      box: 'E2E-1',
      accessDescription: 'Digicode 0000, premier sous-sol.',
      photos: 'e2e-publish-1.jpg',
      dayInEuros: '18',
      from: dayInDays(1),
      to: dayInDays(90),
    });
    await publish.submit();
    await publish.expectPublished();

    const listings = new ListingsPage(page);
    await listings.open();
    await listings.search(address);
    await listings.expectListed(address);
  });
});
