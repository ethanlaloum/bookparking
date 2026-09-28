import {
  cleanDatabase,
  startTestDatabase,
  stopTestDatabase,
} from '../../../../infra/testcontainers-setup';
import { PhotoFormat } from '../../../domain/entities/ListingPhoto';
import { createKnexPhotoStorageSUT } from './KnexPhotoStorage.sut';

const MARC = 'account-marc';
const PIERRE = 'account-pierre';
const MARC_PHOTO = '0f3c5a7e-2b1d-4c8e-9a6f-3d2e1c0b9a88';
const OTHER_MARC_PHOTO = '5d4c3b2a-1f0e-4d9c-8b7a-6f5e4d3c2b1a';
const PIERRE_PHOTO = '6a1e0d9c-8b7f-4e5d-a3c2-b1f0e9d8c7b6';
const NEVER_UPLOADED = '9e8d7c6b-5a4f-4e3d-9c2b-1a0f9e8d7c6b';
const PNG_BYTES = Uint8Array.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0xff,
]);

describe('KnexPhotoStorage', () => {
  beforeAll(async () => {
    await startTestDatabase();
  }, 120000);

  afterEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await stopTestDatabase();
  });

  it('writes the bytes, the format and the owner of a photo in one row', async () => {
    const sut = createKnexPhotoStorageSUT();

    await sut.givenStoredPhoto({
      id: MARC_PHOTO,
      ownerId: MARC,
      format: PhotoFormat.PNG,
      bytes: PNG_BYTES,
    });

    await sut.thenStoredRowIs({
      id: MARC_PHOTO,
      owner_id: MARC,
      format: 'image/png',
      bytes: [...PNG_BYTES],
      uploaded_at: '2026-09-10T00:00:00.000Z',
    });
  });

  it('reads a stored photo back byte for byte', async () => {
    const sut = createKnexPhotoStorageSUT();
    const { photo } = await sut.givenStoredPhoto({
      id: MARC_PHOTO,
      ownerId: MARC,
      format: PhotoFormat.PNG,
      bytes: PNG_BYTES,
    });

    const read = await sut.whenReading(MARC_PHOTO);

    sut.thenPhotoReadIs(read, photo);
  });

  it('reads nothing for an identifier that is not a uuid', async () => {
    const sut = createKnexPhotoStorageSUT();
    await sut.givenStoredPhoto({ id: MARC_PHOTO, ownerId: MARC });

    expect(await sut.whenReading('photo-1.jpg')).toEqual(null);
  });

  it('keeps, in their order, only the identifiers of photos the owner uploaded', async () => {
    const sut = createKnexPhotoStorageSUT();
    await sut.givenStoredPhoto({ id: MARC_PHOTO, ownerId: MARC });
    await sut.givenStoredPhoto({ id: OTHER_MARC_PHOTO, ownerId: MARC });
    await sut.givenStoredPhoto({ id: PIERRE_PHOTO, ownerId: PIERRE });

    const owned = await sut.whenFindingIdsOwnedBy(MARC, [
      OTHER_MARC_PHOTO,
      'photo-1.jpg',
      PIERRE_PHOTO,
      NEVER_UPLOADED,
      MARC_PHOTO,
    ]);

    expect(owned).toEqual([OTHER_MARC_PHOTO, MARC_PHOTO]);
  });
});
