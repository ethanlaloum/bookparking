import { ListingPhotoNotFoundError } from './errors/ListingPhotoNotFoundError';
import { createGetListingPhotoSUT } from './GetListingPhoto.sut';

const PHOTO_ID = '0f3c5a7e-2b1d-4c8e-9a6f-3d2e1c0b9a88';
const OTHER_PHOTO_ID = '6a1e0d9c-8b7f-4e5d-a3c2-b1f0e9d8c7b6';

describe('GetListingPhoto', () => {
  it('reads a stored photo by its identifier', async () => {
    const sut = createGetListingPhotoSUT();
    const { photo } = sut.givenStoredPhoto(PHOTO_ID);

    const result = await sut.whenReading(PHOTO_ID);

    sut.thenPhotoReadIs(result, photo);
  });

  it('refuses an identifier that designates no photo', async () => {
    const sut = createGetListingPhotoSUT();
    sut.givenStoredPhoto(PHOTO_ID);

    const result = await sut.whenReading(OTHER_PHOTO_ID);

    sut.thenReadIsRefusedWith(
      result,
      ListingPhotoNotFoundError,
      'Cette photo est introuvable',
    );
  });
});
