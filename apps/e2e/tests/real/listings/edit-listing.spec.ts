import { test } from '../../../src/fixtures/test';
import { PLACE_PHOTO } from '../../../src/fixtures/photos';
import { EditListingPage } from '../../../src/pages/EditListingPage';
import { ListingDetailPage } from '../../../src/pages/ListingDetailPage';
import { dayInDays, inDays } from '../../../src/seed/Seeder';

test.describe('Listings', () => {
  test('edits the access instructions, photos, vehicles, price and dates without unpublishing', async ({
    page,
    seed,
    app,
  }) => {
    const owner = await seed.user('edit');
    const listing = await seed.listing(owner, {
      accessDescription: 'Digicode 4321, deuxieme sous-sol.',
      acceptedVehicles: ['voiture'],
      pricing: { dayInCents: 1500 },
      availability: { from: inDays(1), to: inDays(120) },
    });

    await app.openAs(owner);
    await page.goto(`/place/${listing.id}`);
    const detail = new ListingDetailPage(page);
    await detail.expectOpen(listing.address);

    const edit = new EditListingPage(page);
    await edit.openFromListing();
    await edit.expectFilledWith({
      accessDescription: 'Digicode 4321, deuxieme sous-sol.',
      checkedVehicles: ['Voiture'],
      uncheckedVehicles: ['Moto ou scooter'],
      dayInEuros: '15',
      from: dayInDays(1),
      to: dayInDays(120),
    });

    await edit.change({
      accessDescription: 'Badge au gardien, box au second sous-sol.',
      check: ['Moto ou scooter'],
      uncheck: ['Voiture'],
      dayInEuros: '18',
      to: dayInDays(60),
    });
    await edit.addPhotos([PLACE_PHOTO], 2);
    await edit.save();
    await edit.expectSaved();

    await edit.backToListing();
    await detail.expectOpen(listing.address);
    await detail.expectAcceptedVehicles(['Moto ou scooter']);
    await detail.expectPrice('Jour', '18');
    await detail.showPhoto(2);
    await detail.expectPhotoShown(2, 2);

    await edit.open(listing.id);
    await edit.expectFilledWith({
      accessDescription: 'Badge au gardien, box au second sous-sol.',
      checkedVehicles: ['Moto ou scooter'],
      uncheckedVehicles: ['Voiture'],
      dayInEuros: '18',
      from: dayInDays(1),
      to: dayInDays(60),
    });
  });

  test('offers no edit form to an account that does not own the listing', async ({
    page,
    seed,
    app,
  }) => {
    const owner = await seed.user('edit-owner');
    const intruder = await seed.user('edit-intruder');
    const listing = await seed.listing(owner);

    await app.openAs(intruder);
    const edit = new EditListingPage(page);
    await edit.open(listing.id);
    await edit.expectNotEditable();
  });
});
