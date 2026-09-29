// Couvert ici : chercher par dates cache la place qu'une demande retient sur ces
// jours, la rend sur d'autres, et la fiche s'ouvre sur les dates cherchées.
// C'est le seul barreau où les dates tapées dans la barre, l'URL, la requête
// `GET /listing?fromDay&toDay` et la liste affichée se voient ensemble.
//
// Sans équivalent ici, et pourquoi :
// - les statuts qui libèrent une place, les jours qui se touchent, l'heure de
//   Paris et la propre demande impayée du conducteur : prouvés au rung
//   `int-repo` (`KnexPlaceOccupancy.int.spec.ts`), sur une vraie base.
// - une place fermée ces jours-là : règle pure, au rung `unit` de l'api.
import { expect, test } from '../../../src/fixtures/test';
import { ListingDetailPage } from '../../../src/pages/ListingDetailPage';
import { SearchPage } from '../../../src/pages/SearchPage';
import { dayInDays, uniqueAddress, uniqueBox } from '../../../src/seed/Seeder';

test.describe('Search', () => {
  test('hides a place held on the searched days and opens a free one on those days', async ({
    page,
    seed,
    api,
  }) => {
    const owner = await seed.user('dates-owner');
    const driver = await seed.user('dates-driver');
    const held = await seed.listing(owner, { address: uniqueAddress(), box: uniqueBox('PRISE') });
    const free = await seed.listing(owner, { address: uniqueAddress(), box: uniqueBox('LIBRE') });
    await api.requestRental(driver.token, {
      address: held.address,
      box: held.box,
      fromDay: dayInDays(10),
      toDay: dayInDays(12),
    });

    const search = new SearchPage(page);
    await search.open();
    await search.chooseStay(dayInDays(12), dayInDays(14));
    await search.submit();

    await expect(page).toHaveURL(new RegExp(`arrivee=${dayInDays(12)}&depart=${dayInDays(14)}`));
    await search.expectListed(free.address);
    await search.expectNotListed(held.address);
    await search.expectStaySummary(/réservées? ou fermées? à ces dates/);

    await search.chooseStay(dayInDays(13), dayInDays(15));
    await search.submit();
    await search.expectListed(free.address);
    await search.expectListed(held.address);

    await search.openListingFromList(free.address);
    const detail = new ListingDetailPage(page);
    await detail.expectOpen(free.address);
    await detail.expectPeriod(dayInDays(13), dayInDays(15));
  });
});
