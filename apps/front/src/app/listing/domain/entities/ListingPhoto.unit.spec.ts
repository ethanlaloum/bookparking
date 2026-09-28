import { describe, expect, it } from 'vitest';

import {
  coverPhotoUrlOf,
  listingPhotoUrl,
  photoDraftSourceOf,
  photoDraftKeyOf,
  storedPhotoDraftsOf,
  withAddedPhotos,
  withoutPhotoAt,
  type LocalPhoto,
} from './ListingPhoto';

const PHOTO_ID = '0f3c5a7e-2b1d-4c8e-9a6f-3d2e1c0b9a88';

const aLocalPhoto = (uri: string): LocalPhoto => ({ uri, name: 'photo.jpg', type: 'image/jpeg' });

describe('listing photos', () => {
  it('reads an uploaded photo from the api', () => {
    expect(listingPhotoUrl('/api', PHOTO_ID)).toEqual(`/api/listing/photo/${PHOTO_ID}`);
  });

  it('has no picture for a reference written before photos were uploaded', () => {
    expect(listingPhotoUrl('/api', 'photo-1.jpg')).toEqual(null);
  });

  it('opens the photos of a listing as stored drafts, in their order', () => {
    expect(storedPhotoDraftsOf([PHOTO_ID, 'photo-1.jpg'])).toEqual([
      { kind: 'stored', id: PHOTO_ID },
      { kind: 'stored', id: 'photo-1.jpg' },
    ]);
  });

  it('adds picked photos after the others, and keeps ten at most', () => {
    const stored = storedPhotoDraftsOf(Array.from({ length: 8 }, (_, index) => `photo-${index}.jpg`));

    const drafts = withAddedPhotos(stored, [aLocalPhoto('blob:1'), aLocalPhoto('blob:2'), aLocalPhoto('blob:3')]);

    expect(drafts).toEqual([
      ...stored,
      { kind: 'local', photo: aLocalPhoto('blob:1') },
      { kind: 'local', photo: aLocalPhoto('blob:2') },
    ]);
  });

  it('removes one photo by its position', () => {
    const drafts = [
      { kind: 'stored' as const, id: PHOTO_ID },
      { kind: 'local' as const, photo: aLocalPhoto('blob:1') },
      { kind: 'stored' as const, id: 'photo-1.jpg' },
    ];

    expect(withoutPhotoAt(drafts, 1)).toEqual([drafts[0], drafts[2]]);
  });

  it('keys a stored photo by its identifier and a picked one by its uri', () => {
    expect([
      photoDraftKeyOf({ kind: 'stored', id: PHOTO_ID }),
      photoDraftKeyOf({ kind: 'local', photo: aLocalPhoto('blob:1') }),
    ]).toEqual([PHOTO_ID, 'blob:1']);
  });

  it('shows a picked photo from its uri, a stored one from the api, and a bare reference not at all', () => {
    expect([
      photoDraftSourceOf('http://192.168.1.98:3000', { kind: 'local', photo: aLocalPhoto('file:///rampe.jpg') }),
      photoDraftSourceOf('http://192.168.1.98:3000', { kind: 'stored', id: PHOTO_ID }),
      photoDraftSourceOf('http://192.168.1.98:3000', { kind: 'stored', id: 'photo-1.jpg' }),
    ]).toEqual(['file:///rampe.jpg', `http://192.168.1.98:3000/listing/photo/${PHOTO_ID}`, null]);
  });

  it('takes as cover the first photo that has a picture', () => {
    expect(coverPhotoUrlOf('/api', ['photo-1.jpg', PHOTO_ID])).toEqual(`/api/listing/photo/${PHOTO_ID}`);
  });

  it('has no cover when no photo has a picture', () => {
    expect(coverPhotoUrlOf('/api', ['photo-1.jpg'])).toEqual(null);
  });
});
