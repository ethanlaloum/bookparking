// Couvert ici : le trajet de l'accueil vers la recherche. C'est le seul barreau
// où l'on voit que les trois critères saisis sur une page arrivent intacts sur
// une autre — la mémoire passant par l'URL, aucun test hors navigateur ne peut
// l'observer.
//
// Comme les autres parcours de carte, celui-ci dépend de la Base Adresse
// Nationale pour l'autocomplétion.
//
// Sans équivalent ici, et pourquoi :
// - la traduction critères ↔ paramètres d'URL : fonctions pures, déjà vertes au
//   rung `unit`, y compris le piège de `Number(null)` qui vaut zéro.
// - le fait que le gabarit de véhicule ne filtre rien : il n'y a rien à
//   observer, justement. Le message qui le dit est assertée ci-dessous, et
//   c'est tout ce qui est vrai aujourd'hui.
import { expect, test } from '../../../src/fixtures/test';
import { SearchPage } from '../../../src/pages/SearchPage';

test.describe('Search', () => {
  test('carries the three criteria from the home page to the search page', async ({
    page,
    seed,
  }) => {
    const owner = await seed.user('home-search');
    await seed.listing(owner, {
      address: '4 place Masséna, 06000 Nice',
      pricing: { weekInCents: 8000 },
    });

    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const search = new SearchPage(page);
    await search.searchField().fill('place mass');
    await search.suggestion('Place Masséna 06000 Nice').click();
    await search.vehicleSelect().selectOption('suv');
    await search.durationSelect().selectOption('week');
    await search.submit();

    await expect(page).toHaveURL(/\/recherche\?/);
    await expect(page).toHaveURL(/vehicule=suv/);
    await expect(page).toHaveURL(/duree=week/);

    await expect(page.getByRole('heading', { level: 1, name: 'Rechercher une place' })).toBeVisible();
    await expect(search.vehicleSelect()).toHaveValue('suv');
    await expect(search.durationSelect()).toHaveValue('week');
    await search.expectSearchSummary(/Autour de : Place Masséna/);
    await search.expectSearchSummary(/ne filtre aucune place/);
  });

  test('restores the same search from a shared link', async ({ page, seed }) => {
    const owner = await seed.user('shared-link');
    await seed.listing(owner, { pricing: { dayInCents: 1500 } });

    await page.goto(
      '/recherche?adresse=Place+Mass%C3%A9na+06000+Nice&lat=43.6975&lon=7.2707&duree=day',
    );

    const search = new SearchPage(page);
    await expect(search.durationSelect()).toHaveValue('day');
    await search.expectSearchSummary(/Autour de : Place Masséna/);
  });
});
