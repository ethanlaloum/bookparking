import { describe, it } from 'vitest';

import { aListing, anOwnerListing } from '../../../../../store/testing/InMemoryDependencies';
import type { LocalPhoto } from '../../entities/ListingPhoto';
import type { EditListingPayload } from '../../ports/ListingGateway';
import { createEditListingSut } from './editListingEpic.sut';

const LISTING_ID = '3f1a9c0e-9c1e-4c5e-8a2b-1f2d3e4a5b6c';
const OTHER_ID = '9b2e7d41-5a6c-4f3e-8d2b-7c1a0e9f4b3d';

const EDITION: EditListingPayload = {
  accessDescription: 'Badge au gardien, le box est au second sous-sol.',
  photos: ['photo-2.jpg', 'photo-3.jpg'],
  acceptedVehicles: ['velo', 'electrique'],
  pricing: { weekInCents: 7000, monthInCents: 20000 },
  availability: { from: '2026-11-01T00:00:00.000Z', to: '2027-01-31T00:00:00.000Z' },
};

const RAMPE: LocalPhoto = { uri: 'file:///rampe.jpg', name: 'rampe.jpg', type: 'image/jpeg' };

const EDITED_OWNER_LISTING = anOwnerListing({
  id: LISTING_ID,
  accessDescription: 'Badge au gardien, le box est au second sous-sol.',
  photos: ['photo-2.jpg', 'photo-3.jpg'],
  acceptedVehicles: ['velo', 'electrique'],
  pricing: { dayInCents: null, weekInCents: 7000, monthInCents: 20000 },
  availability: { from: '2026-11-01T00:00:00.000Z', to: '2027-01-31T00:00:00.000Z' },
});

const EDITED_PUBLIC_LISTING = aListing({
  id: LISTING_ID,
  photos: ['photo-2.jpg', 'photo-3.jpg'],
  acceptedVehicles: ['velo', 'electrique'],
  pricing: { dayInCents: null, weekInCents: 7000, monthInCents: 20000 },
  availability: { from: '2026-11-01T00:00:00.000Z', to: '2027-01-31T00:00:00.000Z' },
});

describe('editing a listing', () => {
  it('sends the whole listing and shows the edit everywhere the listing appears, access instructions only to the owner', () => {
    const sut = createEditListingSut();
    const other = anOwnerListing({ id: OTHER_ID, box: 'C3' });
    sut.givenTheOwnerListings([anOwnerListing({ id: LISTING_ID }), other]);
    sut.givenThePublicListings([aListing({ id: LISTING_ID }), aListing({ id: OTHER_ID, box: 'C3' })]);
    sut.givenTheOpenedListing(aListing({ id: LISTING_ID }));

    sut.whenEditing(LISTING_ID, EDITION);

    sut.thenTheEditsSentAre([{ id: LISTING_ID, listing: EDITION }]);
    sut.thenTheScreenShows({ loading: false, error: null, saved: true });
    sut.thenTheOwnerListingsAre([EDITED_OWNER_LISTING, other]);
    sut.thenThePublicListingsAre([EDITED_PUBLIC_LISTING, aListing({ id: OTHER_ID, box: 'C3' })]);
    sut.thenTheOpenedListingIs(EDITED_PUBLIC_LISTING);
  });

  it('keeps the listing as it was and shows the api message when the edit is refused', () => {
    const sut = createEditListingSut();
    sut.givenTheOwnerListings([anOwnerListing({ id: LISTING_ID })]);
    sut.givenTheApiRejectsWith('La période de disponibilité est déjà passée');

    sut.whenEditing(LISTING_ID, EDITION);

    sut.thenTheScreenShows({
      loading: false,
      error: 'La période de disponibilité est déjà passée',
      saved: false,
    });
    sut.thenTheOwnerListingsAre([anOwnerListing({ id: LISTING_ID })]);
  });

  it('forgets the outcome once the owner leaves the form', () => {
    const sut = createEditListingSut();
    sut.givenTheOwnerListings([anOwnerListing({ id: LISTING_ID })]);
    sut.whenEditing(LISTING_ID, EDITION);

    sut.whenLeavingTheForm();

    sut.thenTheScreenShows({ loading: false, error: null, saved: false });
  });

  it('offers to edit only a published listing of the signed-in owner', () => {
    const sut = createEditListingSut();
    const published = anOwnerListing({ id: LISTING_ID });
    sut.givenTheOwnerListings([published, anOwnerListing({ id: OTHER_ID, status: 'UNPUBLISHED' })]);

    sut.thenTheEditableListingIs(LISTING_ID, published);
    sut.thenTheEditableListingIs(OTHER_ID, null);
    sut.thenTheEditableListingIs('7d0c2a1e-3b4f-4e5d-9a8b-6c7d8e9f0a1b', null);
  });

  it('uploads the photos added to the form and sends them after those the listing kept', () => {
    const sut = createEditListingSut();
    sut.givenTheOwnerListings([anOwnerListing({ id: LISTING_ID })]);

    sut.whenEditingWithPhotos(LISTING_ID, {
      ...EDITION,
      photos: [
        { kind: 'stored', id: 'photo-2.jpg' },
        { kind: 'local', photo: RAMPE },
      ],
    });

    sut.thenTheUploadedPhotosAre([RAMPE]);
    sut.thenTheEditsSentAre([{ id: LISTING_ID, listing: { ...EDITION, photos: ['photo-2.jpg', 'uploaded-1'] } }]);
  });

  it('keeps the listing as it was and shows the refusal when an added photo cannot be uploaded', () => {
    const sut = createEditListingSut();
    sut.givenTheOwnerListings([anOwnerListing({ id: LISTING_ID })]);
    sut.givenThePhotoUploadsAreRefusedWith('Une photo ne doit pas dépasser 10 Mo');

    sut.whenEditingWithPhotos(LISTING_ID, { ...EDITION, photos: [{ kind: 'local', photo: RAMPE }] });

    sut.thenTheEditsSentAre([]);
    sut.thenTheScreenShows({ loading: false, error: 'Une photo ne doit pas dépasser 10 Mo', saved: false });
    sut.thenTheOwnerListingsAre([anOwnerListing({ id: LISTING_ID })]);
  });
});
