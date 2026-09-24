// Couvert ici : qu'un conducteur annule depuis son tableau de bord une location
// payée et confirmée, lise avant de confirmer qu'il sera remboursé, et voie
// ensuite le remboursement. Tout est réel en mode test : l'empreinte posée par
// la carte 4242, son prélèvement à la confirmation du loueur, et le
// remboursement que Stripe accepte au moment de l'annulation.
//
// Sans équivalent ici, et pourquoi :
// - l'annulation tardive, l'échéance figée et l'annulation par le loueur :
//   il faudrait une location qui commence dans moins de 24 heures, ou un délai
//   changé en cours de parcours ; prouvés au rung `unit` sur `CancelRental`.
// - une location commencée : même raison.
import { test } from '../../../src/fixtures/test';
import { DashboardPage } from '../../../src/pages/DashboardPage';
import { dayInDays } from '../../../src/seed/Seeder';

test.describe('Booking cancellation', () => {
  test('lets the renter cancel a paid booking and see the refund @SPEC-005 @EX-005-18', async ({
    page,
    seed,
    api,
    app,
  }) => {
    const owner = await seed.user('cancel-owner');
    const renter = await seed.user('cancel-renter');
    const listing = await seed.listing(owner, { pricing: { dayInCents: 1500 } });
    const requestId = await seed.paidRentalRequest(page, renter, listing, {
      fromDay: dayInDays(60),
      toDay: dayInDays(61),
    });
    await api.confirmRequest(owner.token, requestId);

    await app.openAs(renter);
    const dashboard = new DashboardPage(page);
    await dashboard.open();
    await dashboard.openTab('Mes réservations');
    await dashboard.startCancellingFor(listing.address);
    await dashboard.expectCancellationTerms(/Vous serez remboursé de 30,00\s€\./);
    await dashboard.confirmCancellation();

    await dashboard.expectRequestLabel(listing.address, /Annulée · 30,00\s€ remboursés/);
  });
});
