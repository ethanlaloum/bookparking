// Couvert ici : le cablage de la grille tarifaire, pas son calcul. Le calcul est
// deja vert au rung `unit` du front (Listing.unit.spec.ts, six exemples), et le
// rejouer ici serait un anti-pattern. Ce que seul ce rung peut montrer, c'est
// qu'une grille ecrite par l'api — paliers absents compris, rendus `null` par
// `GET /listing/:id` — traverse la gateway, le store et le selecteur, et
// gouverne ce que l'ecran affiche.
//
// L'annonce amorcee ici n'a qu'un tarif hebdomadaire : trois jours ne sont
// couverts par aucune combinaison de paliers, sept le sont exactement. C'est le
// meme refus que l'api opposerait, obtenu avant l'envoi.
//
// Sans equivalent ici, et pourquoi :
// - les autres combinaisons de paliers : rung `unit`, ou elles coutent des
//   millisecondes au lieu de quarante secondes.
import { test } from '../../../src/fixtures/test';
import { ListingDetailPage } from '../../../src/pages/ListingDetailPage';
import { dayInDays } from '../../../src/seed/Seeder';

test.describe('Rental', () => {
  test('shows no price for a period no tier covers, then the weekly price for seven days', async ({
    page,
    seed,
    app,
  }) => {
    const owner = await seed.user('pricing-owner');
    const renter = await seed.user('pricing-renter');
    const listing = await seed.listing(owner, { pricing: { weekInCents: 6000 } });

    await app.openAs(renter);
    await page.goto(`/place/${listing.id}`);

    const detail = new ListingDetailPage(page);
    await detail.expectOpen(listing.address);

    await detail.choosePeriod(dayInDays(10), dayInDays(12));
    await detail.expectNoPriceCoversPeriod();

    await detail.choosePeriod(dayInDays(10), dayInDays(16));
    await detail.expectEstimate('60');
  });
});
