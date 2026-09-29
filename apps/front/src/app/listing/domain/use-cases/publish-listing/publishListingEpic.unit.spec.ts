import { describe, it } from 'vitest';

import type { LocalPhoto, PublishListingDraft } from '../../entities/ListingPhoto';
import { createPublishListingSut } from './publishListingEpic.sut';

const STORED_PHOTO_ID = '0f3c5a7e-2b1d-4c8e-9a6f-3d2e1c0b9a88';
const FACADE: LocalPhoto = { uri: 'blob:facade', name: 'facade.jpg', type: 'image/jpeg' };
const RAMPE: LocalPhoto = { uri: 'blob:rampe', name: 'rampe.jpg', type: 'image/jpeg' };

const DRAFT: PublishListingDraft = {
  address: '12 rue des Lilas, 75011 Paris',
  box: 'B12',
  accessDescription: 'Digicode 4321, deuxieme sous-sol.',
  photos: [
    { kind: 'local', photo: FACADE },
    { kind: 'stored', id: STORED_PHOTO_ID },
    { kind: 'local', photo: RAMPE },
  ],
  pricing: { dayInCents: 1500 },
  availability: { from: '2026-10-01T00:00:00.000Z', to: '2026-12-31T00:00:00.000Z' },
};

describe('publishing a listing', () => {
  it('uploads the picked photos, then publishes their identifiers in the order of the form', () => {
    const sut = createPublishListingSut();
    sut.whenPublishing(DRAFT);
    sut.thenTheUploadedPhotosAre([FACADE, RAMPE]);
    sut.thenThePublishedListingsAre([
      {
        address: '12 rue des Lilas, 75011 Paris',
        box: 'B12',
        accessDescription: 'Digicode 4321, deuxieme sous-sol.',
        photos: ['uploaded-1', STORED_PHOTO_ID, 'uploaded-2'],
        pricing: { dayInCents: 1500 },
        availability: { from: '2026-10-01T00:00:00.000Z', to: '2026-12-31T00:00:00.000Z' },
      },
    ]);
  });

  it('refetches the listings because the api returns no identifier', () => {
    const sut = createPublishListingSut();
    sut.whenPublishing(DRAFT);
    sut.thenThePublicationSucceeded();
    sut.thenTheListingsWereRefetched(1);
  });

  it('shows the upload refusal and publishes nothing when a photo is refused', () => {
    const sut = createPublishListingSut();
    sut.givenThePhotoUploadsAreRefusedWith('Une photo doit être au format JPEG, PNG ou WebP');
    sut.whenPublishing(DRAFT);
    sut.thenTheErrorShownIs('Une photo doit être au format JPEG, PNG ou WebP');
    sut.thenThePublishedListingsAre([]);
    sut.thenTheListingsWereRefetched(0);
  });

  it('shows the api message and refetches nothing when the place already has a listing', () => {
    const sut = createPublishListingSut();
    sut.givenTheApiRejectsWith('Cette place a deja une annonce active');
    sut.whenPublishing(DRAFT);
    sut.thenTheErrorShownIs('Cette place a deja une annonce active');
    sut.thenTheListingsWereRefetched(0);
  });
});
