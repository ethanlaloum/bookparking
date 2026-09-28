import { ListingStatus } from '../../entities/Listing';
import { ActiveListingNotFoundError } from '../../errors/ActiveListingNotFoundError';
import { AvailabilityPeriodExpiredError } from '../../errors/AvailabilityPeriodExpiredError';
import { IncompletePricingError } from '../../errors/IncompletePricingError';
import { ListingNotOwnedError } from '../../errors/ListingNotOwnedError';
import { UnknownPhotoError } from '../../errors/UnknownPhotoError';
import { UnknownVehicleTypeError } from '../../errors/UnknownVehicleTypeError';
import { createEditListingSUT } from './EditListing.sut';

const MARC = 'Marc D.';
const PIERRE = 'Pierre L.';
const LISTING_ID = '8f1d3b3e-9f1a-4a0e-8f1a-2b7c5d9e0a11';

const PUBLISHED = {
  accessDescription:
    'portail bleu à gauche du 12, le box est au fond du premier sous-sol',
  photos: ['photo-1', 'photo-2'],
  acceptedVehicles: ['voiture', 'moto'],
  pricing: { day: 1200, week: 6000, month: 18000 },
  availability: { from: '2026-10-01', to: '2026-10-31' },
};

const EDITED = {
  accessDescription: 'badge au gardien, le box est au second sous-sol',
  photos: ['photo-2', 'photo-3'],
  acceptedVehicles: ['velo', 'electrique'],
  pricing: { day: null, week: 7000, month: 20000 },
  availability: { from: '2026-11-01', to: '2027-01-31' },
};

describe('EditListing', () => {
  it('replaces the access instructions, photos, vehicles, pricing and dates, and keeps the place', async () => {
    const sut = createEditListingSUT();
    sut.givenListing({ owner: MARC, ...PUBLISHED });
    sut.givenPhotoUploadedBy(MARC, 'photo-3');

    const result = await sut.whenEditing({
      owner: MARC,
      listingId: LISTING_ID,
      ...EDITED,
      editedAt: '2026-09-20',
    });

    sut.thenEditedListingIs(result, { owner: MARC, ...EDITED });
  });

  it('keeps editing a listing whose period has already started', async () => {
    const sut = createEditListingSUT();
    sut.givenListing({ owner: MARC, ...PUBLISHED });
    sut.givenPhotoUploadedBy(MARC, 'photo-3');
    const running = {
      ...EDITED,
      availability: { from: '2026-10-01', to: '2026-12-31' },
    };

    const result = await sut.whenEditing({
      owner: MARC,
      listingId: LISTING_ID,
      ...running,
      editedAt: '2026-10-15',
    });

    sut.thenEditedListingIs(result, { owner: MARC, ...running });
  });

  it('keeps the photos the listing already carries without asking where they came from', async () => {
    const sut = createEditListingSUT();
    sut.givenListing({ owner: MARC, ...PUBLISHED });

    const result = await sut.whenEditing({
      owner: MARC,
      listingId: LISTING_ID,
      ...EDITED,
      photos: ['photo-2', 'photo-1'],
      editedAt: '2026-09-20',
    });

    sut.thenEditedListingIs(result, {
      owner: MARC,
      ...EDITED,
      photos: ['photo-2', 'photo-1'],
    });
  });

  it('refuses an edit from someone who does not own the listing', async () => {
    const sut = createEditListingSUT();
    const { listing } = sut.givenListing({ owner: MARC, ...PUBLISHED });

    const result = await sut.whenEditing({
      owner: PIERRE,
      listingId: LISTING_ID,
      ...EDITED,
      editedAt: '2026-09-20',
    });

    sut.thenEditIsRefusedWith(
      result,
      ListingNotOwnedError,
      'Cette annonce ne vous appartient pas',
    );
    sut.thenListingIsUnchanged(listing);
  });

  it('refuses to edit a listing that is no longer published', async () => {
    const sut = createEditListingSUT();
    const { listing } = sut.givenListing({
      owner: MARC,
      ...PUBLISHED,
      status: ListingStatus.UNPUBLISHED,
    });

    const result = await sut.whenEditing({
      owner: MARC,
      listingId: LISTING_ID,
      ...EDITED,
      editedAt: '2026-09-20',
    });

    sut.thenEditIsRefusedWith(
      result,
      ActiveListingNotFoundError,
      "Cette place n'a aucune annonce active",
    );
    sut.thenListingIsUnchanged(listing);
  });

  it('refuses dates that are already entirely past', async () => {
    const sut = createEditListingSUT();
    const { listing } = sut.givenListing({ owner: MARC, ...PUBLISHED });

    const result = await sut.whenEditing({
      owner: MARC,
      listingId: LISTING_ID,
      ...EDITED,
      availability: { from: '2026-08-01', to: '2026-08-31' },
      editedAt: '2026-09-20',
    });

    sut.thenEditIsRefusedWith(
      result,
      AvailabilityPeriodExpiredError,
      'La période de disponibilité est déjà passée',
    );
    sut.thenListingIsUnchanged(listing);
  });

  it('refuses a pricing grid without any duration', async () => {
    const sut = createEditListingSUT();
    const { listing } = sut.givenListing({ owner: MARC, ...PUBLISHED });

    const result = await sut.whenEditing({
      owner: MARC,
      listingId: LISTING_ID,
      ...EDITED,
      pricing: { day: null, week: null, month: null },
      editedAt: '2026-09-20',
    });

    sut.thenEditIsRefusedWith(
      result,
      IncompletePricingError,
      'La grille tarifaire est incomplète',
    );
    sut.thenListingIsUnchanged(listing);
  });

  it('refuses a vehicle type that does not exist', async () => {
    const sut = createEditListingSUT();
    const { listing } = sut.givenListing({ owner: MARC, ...PUBLISHED });

    const result = await sut.whenEditing({
      owner: MARC,
      listingId: LISTING_ID,
      ...EDITED,
      acceptedVehicles: ['voiture', 'tracteur'],
      editedAt: '2026-09-20',
    });

    sut.thenEditIsRefusedWith(
      result,
      UnknownVehicleTypeError,
      "Ce type de véhicule n'existe pas",
    );
    sut.thenListingIsUnchanged(listing);
  });

  it('refuses a new photo its owner never uploaded', async () => {
    const sut = createEditListingSUT();
    const { listing } = sut.givenListing({ owner: MARC, ...PUBLISHED });

    const result = await sut.whenEditing({
      owner: MARC,
      listingId: LISTING_ID,
      ...EDITED,
      editedAt: '2026-09-20',
    });

    sut.thenEditIsRefusedWith(
      result,
      UnknownPhotoError,
      "Une photo de l'annonce n'a pas été envoyée par son propriétaire",
    );
    sut.thenListingIsUnchanged(listing);
  });

  it('refuses a new photo uploaded by someone else', async () => {
    const sut = createEditListingSUT();
    const { listing } = sut.givenListing({ owner: MARC, ...PUBLISHED });
    sut.givenPhotoUploadedBy(PIERRE, 'photo-3');

    const result = await sut.whenEditing({
      owner: MARC,
      listingId: LISTING_ID,
      ...EDITED,
      editedAt: '2026-09-20',
    });

    sut.thenEditIsRefusedWith(
      result,
      UnknownPhotoError,
      "Une photo de l'annonce n'a pas été envoyée par son propriétaire",
    );
    sut.thenListingIsUnchanged(listing);
  });
});
