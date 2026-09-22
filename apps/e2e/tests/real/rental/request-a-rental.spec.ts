// Couvert ici : demander une location depuis la fiche et voir la confirmation.
// Le parcours vaut pour lui-meme parce que `POST /rental-request` repond 201
// sans corps : le front n'apprend jamais l'identifiant cree et doit se rabattre
// sur la charge qu'il a soumise pour afficher quoi que ce soit.
//
// Sans equivalent ici, et pourquoi :
// - confirmer une demande : l'api ne rend l'identifiant d'une demande sur
//   aucune route, et aucune ne les liste. L'ecran de confirmation n'est donc
//   atteignable que par lien profond, avec un identifiant qu'aucun client ne
//   peut obtenir. L'exemple appartient au rung `int-http` tant que le contrat
//   n'expose pas cet identifiant.
// - les refus metier (dates deja louees, periode trop longue, aucune annonce
//   publiee) : tous verts au rung `unit` cote api.
import { test } from '../../../src/fixtures/test';
import { ListingDetailPage } from '../../../src/pages/ListingDetailPage';
import { dayInDays } from '../../../src/seed/Seeder';

test.describe('Rental', () => {
  test('requests a rental on an available period and shows the confirmation', async ({
    page,
    seed,
    app,
  }) => {
    const owner = await seed.user('rental-owner');
    const renter = await seed.user('renter');
    const listing = await seed.listing(owner);

    await app.openAs(renter);
    await page.goto(`/place/${listing.id}`);

    const detail = new ListingDetailPage(page);
    await detail.expectOpen(listing.address);
    await detail.choosePeriod(dayInDays(10), dayInDays(12));
    await detail.requestRental();
    await detail.expectRequestSent();
  });
});
