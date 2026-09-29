// Couvert ici : que rien ne parte vers Google ni vers OpenStreetMap avant
// l'accord du visiteur, que « Tout refuser » soit retenu d'une page à l'autre,
// que l'encart de la carte n'accorde que la carte, et que l'accord se retire
// depuis le pied de page. C'est le seul barreau qui voit les requêtes réelles
// d'un navigateur : un test unitaire ne sait pas si une feuille de style est
// partie.
//
// Les tuiles et les polices viennent des vrais serveurs, comme dans les
// parcours de carte : rien n'est simulé, et une panne de l'un d'eux ferait
// échouer les deux tests qui l'attendent.
//
// Sans équivalent ici, et pourquoi :
// - la durée de six mois et la version des finalités : fonctions pures de
//   `Consent.ts`, vertes au rung `unit` du front — attendre six mois dans un
//   navigateur n'apprendrait rien de plus ;
// - un enregistrement abîmé dans le navigateur : même raison, `parseConsent`.
import { expect, test } from '../../../src/fixtures/test';
import { CookieConsent, watchThirdParties } from '../../../src/pages/CookieConsent';
import { SearchPage } from '../../../src/pages/SearchPage';

test.use({ consent: 'undecided' });

test.describe('Cookie consent', () => {
  test('asks on a first visit, and loads nothing from a third party meanwhile', async ({
    page,
    seed,
  }) => {
    const owner = await seed.user('consent-first-visit');
    await seed.listing(owner, { address: '12 rue Barla, 06300 Nice' });
    const thirdParties = watchThirdParties(page);
    const consent = new CookieConsent(page);
    const search = new SearchPage(page);

    await search.open();
    await expect(consent.banner()).toBeVisible();
    await expect(consent.mapPlaceholder()).toBeVisible();
    await search.expectListed('12 rue Barla, 06300 Nice');

    await expect(page.locator('.leaflet-container')).toHaveCount(0);
    expect(thirdParties.fonts).toEqual([]);
    expect(thirdParties.map).toEqual([]);
  });

  test('remembers a refusal from one visit to the next', async ({ page }) => {
    const thirdParties = watchThirdParties(page);
    const consent = new CookieConsent(page);
    const search = new SearchPage(page);

    await search.open();
    await consent.refuseAll();

    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: 'Rechercher une place' })).toBeVisible();
    await expect(consent.mapPlaceholder()).toBeVisible();
    await expect(consent.banner()).toHaveCount(0);

    expect(thirdParties.fonts).toEqual([]);
    expect(thirdParties.map).toEqual([]);
  });

  test('loads the fonts and the map once everything is accepted', async ({ page, seed }) => {
    const owner = await seed.user('consent-accept-all');
    await seed.listing(owner, { address: '12 rue Barla, 06300 Nice' });
    const consent = new CookieConsent(page);
    const search = new SearchPage(page);

    await search.open();
    const fonts = page.waitForRequest(/fonts\.googleapis\.com/);
    const tiles = page.waitForRequest(/tile\.openstreetmap\.org/);
    await consent.acceptAll();

    await fonts;
    await search.expectMapVisible();
    await tiles;
  });

  test('grants the map alone from its placeholder', async ({ page, seed }) => {
    const owner = await seed.user('consent-placeholder');
    await seed.listing(owner, { address: '12 rue Barla, 06300 Nice' });
    const thirdParties = watchThirdParties(page);
    const consent = new CookieConsent(page);
    const search = new SearchPage(page);

    await search.open();
    await consent.showMapFromPlaceholder();
    await search.expectMapVisible();

    await consent.openSettingsFromFooter();
    await consent.expectPurpose('Carte (OpenStreetMap)', true);
    await consent.expectPurpose('Polices (Google Fonts)', false);
    expect(thirdParties.fonts).toEqual([]);
  });

  test('takes the map away when consent is withdrawn from the footer', async ({ page, seed }) => {
    const owner = await seed.user('consent-withdraw');
    await seed.listing(owner, { address: '12 rue Barla, 06300 Nice' });
    const consent = new CookieConsent(page);
    const search = new SearchPage(page);

    await search.open();
    await consent.acceptAll();
    await search.expectMapVisible();

    await consent.openSettingsFromFooter();
    await consent.setPurpose('Carte (OpenStreetMap)', false);
    await consent.save();

    await expect(consent.mapPlaceholder()).toBeVisible();
    await expect(page.locator('.leaflet-container')).toHaveCount(0);
  });
});
