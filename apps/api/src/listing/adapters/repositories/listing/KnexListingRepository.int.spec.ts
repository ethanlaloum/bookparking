import {
  cleanDatabase,
  startTestDatabase,
  stopTestDatabase,
} from '../../../../infra/testcontainers-setup';
import { ListingAlreadyActiveError } from '../../../domain/usecases/publish-listing/errors/ListingAlreadyActiveError';
import { VehicleType } from '../../../domain/entities/Listing';
import { createKnexListingRepositorySUT } from './KnexListingRepository.sut';

describe('KnexListingRepository @SPEC-001', () => {
  beforeAll(async () => {
    await startTestDatabase();
  }, 120000);

  afterEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await stopTestDatabase();
  });

  it('writes no listing row when a photo was never uploaded @EX-001-19', async () => {
    const sut = createKnexListingRepositorySUT();

    await sut.whenPublishing({
      owner: 'Marc D.',
      address: '12 rue Barla, 06300 Nice',
      box: '12',
      accessDescription:
        'portail bleu à gauche du 12, le box est au fond du premier sous-sol',
      photos: ['photo-1'],
      pricing: { day: 1200, week: 6000, month: 18000 },
      availability: { from: '2026-10-01', to: '2026-10-31' },
      publishedAt: '2026-09-10',
    });

    await sut.thenNoListingRow({
      address: '12 rue Barla, 06300 Nice',
      box: '12',
    });
  });

  it('keeps a single active listing when the same place is written twice differently @EX-001-39', async () => {
    const sut = createKnexListingRepositorySUT();

    const first = await sut.whenCreatingActiveListing({
      owner: 'Marc D.',
      address: '12 rue barla, 06300 nice',
      box: '12',
    });
    const second = await sut.whenCreatingActiveListing({
      owner: 'Pierre L.',
      address: '12 Rue Barla, 06300 NICE\n',
      box: '12',
    });

    sut.thenCreationSucceeded(first);
    sut.thenCreationIsRefusedWith(
      second,
      ListingAlreadyActiveError,
      'Cette place a déjà une annonce active',
    );
    await sut.thenActiveRowCountIs(1);
  });

  it('stores a listing as unpublished and stops returning it as active @EX-001-42', async () => {
    const sut = createKnexListingRepositorySUT();
    await sut.whenCreatingActiveListing({
      owner: 'Marc D.',
      address: '12 rue Barla, 06300 Nice',
      box: '12',
    });

    await sut.whenUnpublishing({
      owner: 'Marc D.',
      address: '12 rue Barla, 06300 Nice',
      box: '12',
    });

    await sut.thenStoredListingIsUnpublished({
      address: '12 rue Barla, 06300 Nice',
      box: '12',
    });
    await sut.thenNoActiveListingIsFoundFor({
      address: '12 rue Barla, 06300 Nice',
      box: '12',
    });
  });
  it('lists only the active listings, most recent first', async () => {
    const sut = createKnexListingRepositorySUT();
    await sut.givenActiveListingRow({
      address: '12 rue Barla, 06300 Nice',
      box: '12',
      publishedAt: '2026-09-10',
    });
    await sut.givenActiveListingRow({
      address: '3 avenue Malausséna, 06000 Nice',
      box: '4',
      publishedAt: '2026-09-20',
    });
    await sut.givenUnpublishedListingRow({
      address: '7 rue de France, 06000 Nice',
      box: '1',
      publishedAt: '2026-09-15',
    });

    const listed = await sut.whenListingAllActive();

    sut.thenListedPlacesAre(listed, [
      { address: '3 avenue Malausséna, 06000 Nice', box: '4' },
      { address: '12 rue Barla, 06300 Nice', box: '12' },
    ]);
  });

  it('writes every edited column of the listing and leaves its place untouched', async () => {
    const sut = createKnexListingRepositorySUT();
    const listingId = '8f1d3b3e-9f1a-4a0e-8f1a-2b7c5d9e0a11';
    await sut.givenListingRow({
      id: listingId,
      owner: 'Marc D.',
      address: '12 rue Barla, 06300 Nice',
      box: '12',
    });
    sut.givenPhotoUploadedBy('Marc D.', 'photo-2');
    sut.givenPhotoUploadedBy('Marc D.', 'photo-3');

    await sut.whenEditing({
      owner: 'Marc D.',
      listingId,
      accessDescription: 'badge au gardien, le box est au second sous-sol',
      photos: ['photo-2', 'photo-3'],
      acceptedVehicles: [VehicleType.VELO, VehicleType.ELECTRIQUE],
      pricing: { day: null, week: 7000, month: 20000 },
      availability: { from: '2026-11-01', to: '2027-01-31' },
      editedAt: '2026-09-20',
    });

    await sut.thenStoredEditableColumnsAre(listingId, {
      address: '12 rue Barla, 06300 Nice',
      box: '12',
      status: 'ACTIVE',
      access_description: 'badge au gardien, le box est au second sous-sol',
      photos: ['photo-2', 'photo-3'],
      accepted_vehicles: ['velo', 'electrique'],
      day_price_in_cents: null,
      week_price_in_cents: 7000,
      month_price_in_cents: 20000,
      available_from: new Date('2026-11-01T00:00:00.000Z'),
      available_to: new Date('2027-01-31T00:00:00.000Z'),
    });
  });
});
