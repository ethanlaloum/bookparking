import { describe, it } from 'vitest';

import { createListingGatewaySut } from './RealListingGateway.sut';

const LISTING_ID = '3f1a9c0e-9c1e-4c5e-8a2b-1f2d3e4a5b6c';

describe('the listing gateway', () => {
  it('reads the active listings from GET /listing', async () => {
    const sut = createListingGatewaySut();
    sut.givenTheApiAnswers('GET', '/listing', [sut.aListing(), sut.aListing({ id: 'autre' })]);
    await sut.whenReadingTheActiveListings();
    sut.thenTheCallsWere([{ method: 'GET', path: '/listing' }]);
    sut.thenTheListingsReadAre(2);
  });

  it('reads one listing from GET /listing/{id}', async () => {
    const sut = createListingGatewaySut();
    sut.givenTheApiAnswers('GET', `/listing/${LISTING_ID}`, sut.aListing());
    await sut.whenReadingTheListing(LISTING_ID);
    sut.thenTheCallsWere([{ method: 'GET', path: `/listing/${LISTING_ID}` }]);
  });

  it('surfaces the api message when the listing is unknown', async () => {
    const sut = createListingGatewaySut();
    sut.givenTheApiRefuses('GET', `/listing/${LISTING_ID}`, 404, 'Annonce introuvable');
    await sut.whenReadingTheListing(LISTING_ID);
    sut.thenTheRefusalMessageIs('Annonce introuvable');
  });

  it('unpublishes through DELETE /listing/{id}', async () => {
    const sut = createListingGatewaySut();
    await sut.whenUnpublishing(LISTING_ID);
    sut.thenTheCallsWere([{ method: 'DELETE', path: `/listing/${LISTING_ID}` }]);
  });

  it('sends the whole edited listing to PATCH /listing/{id} and reads back what the owner sees', async () => {
    const sut = createListingGatewaySut();
    const edited = sut.anOwnerListing({
      accessDescription: 'Badge au gardien.',
      photos: ['photo-2.jpg'],
      acceptedVehicles: ['velo'],
      pricing: { dayInCents: null, weekInCents: 7000, monthInCents: null },
      availability: { from: '2026-11-01T00:00:00.000Z', to: '2027-01-31T00:00:00.000Z' },
    });
    sut.givenTheApiAnswers('PATCH', `/listing/${LISTING_ID}`, edited);
    await sut.whenEditing(LISTING_ID, {
      accessDescription: 'Badge au gardien.',
      photos: ['photo-2.jpg'],
      acceptedVehicles: ['velo'],
      pricing: { weekInCents: 7000 },
      availability: { from: '2026-11-01T00:00:00.000Z', to: '2027-01-31T00:00:00.000Z' },
    });
    sut.thenTheCallsWere([{ method: 'PATCH', path: `/listing/${LISTING_ID}` }]);
    sut.thenTheBodySentWas({
      accessDescription: 'Badge au gardien.',
      photos: ['photo-2.jpg'],
      acceptedVehicles: ['velo'],
      pricing: { weekInCents: 7000 },
      availability: { from: '2026-11-01T00:00:00.000Z', to: '2027-01-31T00:00:00.000Z' },
    });
    sut.thenTheListingReadIs(edited);
  });

  it('uploads a photo as a multipart form to POST /listing/photo and reads back its identifier', async () => {
    const sut = createListingGatewaySut();
    const photo = { uri: 'blob:facade', name: 'facade.jpg', type: 'image/jpeg' };
    sut.givenTheApiAnswers('POST', '/listing/photo', { id: '0f3c5a7e-2b1d-4c8e-9a6f-3d2e1c0b9a88' });
    await sut.whenUploading(photo);
    sut.thenTheCallsWere([{ method: 'POST', path: '/listing/photo' }]);
    sut.thenThePhotosTurnedIntoFormPartsAre([photo]);
    await sut.thenTheFormSentCarries({ field: 'photo', fileName: 'facade.jpg', content: 'blob:facade' });
    sut.thenThePhotoIdReadIs('0f3c5a7e-2b1d-4c8e-9a6f-3d2e1c0b9a88');
  });

  it('reads the places free on a stay from GET /listing?fromDay&toDay', async () => {
    const sut = createListingGatewaySut();
    sut.givenTheApiAnswers('GET', '/listing?fromDay=2026-10-10&toDay=2026-10-12', [sut.aListing()]);
    await sut.whenReadingTheFreeListings({ from: '2026-10-10', to: '2026-10-12' });
    sut.thenTheCallsWere([{ method: 'GET', path: '/listing?fromDay=2026-10-10&toDay=2026-10-12' }]);
    sut.thenTheListingsReadAre(1);
  });
});
