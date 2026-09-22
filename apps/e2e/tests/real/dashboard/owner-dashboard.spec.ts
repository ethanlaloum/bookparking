// Couvert ici : le parcours du propriétaire, de bout en bout. Il voit ses
// places, voit la demande qu'un locataire vient de faire, la confirme, et
// constate que ses revenus bougent. Ce parcours n'était pas atteignable avant
// que l'api rende l'identifiant d'une demande : `GET /rental-request/received`
// est la seule route qui le fasse, et donc la seule qui rende la confirmation
// utilisable depuis un navigateur.
//
// Le total des revenus est assertion légitime ici — contrairement à un décompte
// global sur environnement partagé — parce que le propriétaire est amorcé par
// ce test seul et n'a reçu aucune autre demande.
//
// Sans équivalent ici, et pourquoi :
// - le calcul des revenus lui-même : fonction pure, déjà verte au rung `unit`
//   du front (RentalRequestView.unit.spec.ts), où il coûte des millisecondes.
// - une annonce dépubliée montrée dans « Mes places » : c'est une lecture de
//   statut, prouvée au rung `unit` de l'api sur ListOwnerListings.
import { expect, test } from '../../../src/fixtures/test';
import { DashboardPage } from '../../../src/pages/DashboardPage';
import { dayInDays } from '../../../src/seed/Seeder';

test.describe('Dashboard', () => {
  test('shows the owner places, confirms a received request and moves the revenue', async ({
    page,
    seed,
    api,
    app,
  }) => {
    const owner = await seed.user('dashboard-owner');
    const renter = await seed.user('dashboard-renter');
    const listing = await seed.listing(owner, { pricing: { dayInCents: 1500 } });

    await api.requestRental(renter.token, {
      address: listing.address,
      box: listing.box,
      fromDay: dayInDays(10),
      toDay: dayInDays(12),
    });

    await app.openAs(owner);
    const dashboard = new DashboardPage(page);
    await dashboard.open();

    await dashboard.expectPublishedPlaces(1);
    await dashboard.expectConfirmedRevenue('0');

    await dashboard.openTab('Mes places');
    await expect(dashboard.listedPlace(listing.address)).toBeVisible();

    await dashboard.openTab('Demandes reçues');
    await dashboard.confirmRequestFor(listing.address);
    await dashboard.expectRequestConfirmed(listing.address);

    await dashboard.openTab("Vue d'ensemble");
    await dashboard.expectConfirmedRevenue('45');
  });

  test('shows no received request to an owner nobody asked', async ({ page, seed, app }) => {
    const owner = await seed.user('quiet-owner');
    await seed.listing(owner);

    await app.openAs(owner);
    const dashboard = new DashboardPage(page);
    await dashboard.open();
    await dashboard.openTab('Demandes reçues');

    await dashboard.expectNoRequests();
  });
});
