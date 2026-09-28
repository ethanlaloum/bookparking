// Couvert ici : qu'un compte se supprime lui-même depuis « Réglages », mot de
// passe redemandé, qu'il atterrisse sur « Votre compte est supprimé » et que son
// adresse ne connecte plus personne ; et que l'api le retienne tant qu'une
// demande payée attend la réponse du loueur, message affiché dans la fenêtre.
//
// Sans équivalent ici, et pourquoi :
// - ce que la suppression efface ou dépublie ligne à ligne, et les autres
//   engagements qui la retiennent (réservation à venir, versement dû) : prouvés
//   sur un vrai Postgres par `KnexAccountFootprint.int.spec.ts`.
// - le jeton d'un autre appareil qui tombe avec le compte : rung `unit` de
//   `SlidingAccessTokenVerifier`, et parcours `.http` (27 à 29).
import { expect, test } from '../../../src/fixtures/test';
import { DashboardPage } from '../../../src/pages/DashboardPage';
import { HeaderNav } from '../../../src/pages/HeaderNav';
import { SignInPage } from '../../../src/pages/SignInPage';
import { dayInDays } from '../../../src/seed/Seeder';

test.describe('Account deletion', () => {
  test('deletes the account from the settings, for good', async ({ page, seed, app, target }) => {
    const user = await seed.user('delete');

    await app.openAs(user);
    const dashboard = new DashboardPage(page);
    await dashboard.open();
    await dashboard.openTab('Réglages');
    await dashboard.deleteAccount(user.password);

    await dashboard.expectAccountDeleted();
    await expect(page).toHaveURL(`${target.frontUrl}/compte-supprime`);
    await new HeaderNav(page).expectSignedOut();

    const signIn = new SignInPage(page);
    await signIn.open();
    await signIn.signIn(user.email, user.password);
    await signIn.expectRefusal();
  });

  test('keeps the account when the password is wrong', async ({ page, seed, app }) => {
    const user = await seed.user('delete-wrong');

    await app.openAs(user);
    const dashboard = new DashboardPage(page);
    await dashboard.open();
    await dashboard.openTab('Réglages');
    await dashboard.deleteAccount('pas-le-bon-mot-de-passe');

    await dashboard.expectDeletionRefused('Adresse e-mail ou mot de passe incorrect');
    await new HeaderNav(page).expectSignedIn();
  });

  test('keeps the account of a driver whose paid request awaits the owner', async ({
    page,
    seed,
    app,
  }) => {
    const owner = await seed.user('delete-owner');
    const renter = await seed.user('delete-renter');
    const listing = await seed.listing(owner, { pricing: { dayInCents: 1500 } });
    await seed.paidRentalRequest(page, renter, listing, {
      fromDay: dayInDays(60),
      toDay: dayInDays(61),
    });

    await app.openAs(renter);
    const dashboard = new DashboardPage(page);
    await dashboard.open();
    await dashboard.openTab('Réglages');
    await dashboard.deleteAccount(renter.password);

    await dashboard.expectDeletionRefused(
      "Une demande, une réservation ou un versement est encore en cours sur votre compte : vous pourrez le supprimer une fois qu'ils seront terminés",
    );
    await new HeaderNav(page).expectSignedIn();
  });
});
