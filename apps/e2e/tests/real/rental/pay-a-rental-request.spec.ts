// Couvert ici : qu'une demande mène à la vraie page de paiement de Stripe, au
// prix que l'api a figé ; qu'en revenir sans payer rende les dates aussitôt ;
// et qu'une empreinte posée avec la carte de test fasse passer la demande au
// propriétaire. C'est le seul barreau où l'adaptateur Stripe parle au vrai
// Stripe : les barreaux de l'api le remplacent tous par un double.
//
// Tout est réel, en mode test : la page de Stripe, la carte 4242, et
// l'événement signé que `stripe listen` relaie jusqu'à l'api locale. Si Stripe
// ou la CLI manquent, ces parcours échouent — et c'est juste, l'encaissement
// aussi.
//
// Sans équivalent ici, et pourquoi :
// - l'expiration à 48 heures et la levée de l'empreinte : il faudrait attendre
//   48 heures ; prouvées au rung `unit` sur `SweepRentalRequests`, et le
//   déclencheur périodique sur `RentalSweepScheduler`.
// - le prélèvement à la confirmation et son refus par la banque : prouvés au
//   rung `unit` sur `ConfirmRentalRequest` ; le tableau de bord du loueur
//   confirme, lui, une demande payée par ce même chemin.
// - un événement mal signé : `int-http`, sur la route du webhook.
import { expect, test } from '../../../src/fixtures/test';
import { DashboardPage } from '../../../src/pages/DashboardPage';
import { ListingDetailPage } from '../../../src/pages/ListingDetailPage';
import { StripeCheckoutPage } from '../../../src/pages/StripeCheckoutPage';
import { checkoutEmail, dayInDays } from '../../../src/seed/Seeder';

test.describe('Rental payment', () => {
  test('takes the renter to the Stripe payment page for the right amount @SPEC-004 @EX-004-38', async ({
    page,
    seed,
    app,
  }) => {
    const owner = await seed.user('payment-owner');
    const renter = await seed.user('payment-renter');
    const listing = await seed.listing(owner, { pricing: { dayInCents: 1500 } });

    await app.openAs(renter);
    await page.goto(`/place/${listing.id}`);
    const detail = new ListingDetailPage(page);
    await detail.expectOpen(listing.address);
    await detail.choosePeriod(dayInDays(10), dayInDays(12));
    await detail.continueToPayment();

    const checkout = new StripeCheckoutPage(page);
    await checkout.expectOpen();
    await checkout.expectAmount('45,00');
  });

  test('frees the dates when the renter comes back without paying @SPEC-004 @EX-004-39', async ({
    page,
    seed,
    app,
  }) => {
    const owner = await seed.user('abandon-owner');
    const renter = await seed.user('abandon-renter');
    const listing = await seed.listing(owner, { pricing: { dayInCents: 1500 } });

    await app.openAs(renter);
    await page.goto(`/place/${listing.id}`);
    const detail = new ListingDetailPage(page);
    await detail.choosePeriod(dayInDays(10), dayInDays(12));
    await detail.continueToPayment();
    await new StripeCheckoutPage(page).leaveWithoutPaying();

    await expect(page).toHaveURL(new RegExp(`/place/${listing.id}\\?paiement=abandonne$`));
    await detail.expectNothingWasHeld();

    await detail.choosePeriod(dayInDays(10), dayInDays(12));
    await detail.continueToPayment();
    await new StripeCheckoutPage(page).expectOpen();
  });

  test('shows the hold to the renter and the request to the owner once paid @SPEC-004 @EX-004-40', async ({
    page,
    seed,
    app,
  }) => {
    const owner = await seed.user('paid-owner');
    const renter = await seed.user('paid-renter');
    const listing = await seed.listing(owner, { pricing: { dayInCents: 1500 } });

    await app.openAs(renter);
    await page.goto(`/place/${listing.id}`);
    const detail = new ListingDetailPage(page);
    await detail.choosePeriod(dayInDays(10), dayInDays(12));
    await detail.continueToPayment();
    await new StripeCheckoutPage(page).payWithTestCard(checkoutEmail());

    await expect(page.getByText(/^Empreinte de 45,00\s€ · en attente du loueur$/)).toBeVisible({
      timeout: 60_000,
    });

    await app.openAs(owner);
    const dashboard = new DashboardPage(page);
    await dashboard.open();
    await dashboard.openTab('Demandes reçues');
    await expect(page.getByText(listing.address).first()).toBeVisible();
  });
});
