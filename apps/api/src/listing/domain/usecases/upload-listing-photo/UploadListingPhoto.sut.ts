import { Either } from 'effect/index';

import { InMemoryPhotoStorage } from '../../../adapters/repositories/listing-photo/InMemoryPhotoStorage';
import { ListingPhoto, PhotoFormat } from '../../entities/ListingPhoto';
import { UploadListingPhoto } from './UploadListingPhoto';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export const createUploadListingPhotoSUT = () => {
  const photoStorage = new InMemoryPhotoStorage();
  const uploadListingPhoto = new UploadListingPhoto(photoStorage);

  const testConstants = {
    ownerIdForTest: 'account-marc',
    uploadedAtForTest: new Date('2026-09-28T10:00:00.000Z'),
  };

  const context = { photoStorage, uploadListingPhoto, testConstants };

  return {
    context,

    async whenUploading(bytes: Uint8Array) {
      return context.uploadListingPhoto.execute({
        ownerId: context.testConstants.ownerIdForTest,
        bytes,
        uploadedAt: context.testConstants.uploadedAtForTest,
      });
    },

    thenStoredPhotoIs(
      result: Either.Either<ListingPhoto, unknown>,
      expected: { format: PhotoFormat; bytes: Uint8Array },
    ) {
      expect(Either.isRight(result)).toEqual(true);
      if (!Either.isRight(result)) return;
      expect(result.right.id).toMatch(UUID_PATTERN);
      const expectedState = {
        id: result.right.id,
        ownerId: context.testConstants.ownerIdForTest,
        format: expected.format,
        bytes: expected.bytes,
        uploadedAt: context.testConstants.uploadedAtForTest,
      };
      expect(result.right.toState()).toEqual(expectedState);
      expect(
        context.photoStorage.photoList.map((photo) => photo.toState()),
      ).toEqual([expectedState]);
    },

    thenUploadIsRefusedWith(
      result: Either.Either<unknown, unknown>,
      ErrorClass: new (...args: never[]) => Error,
      message: string,
    ) {
      expect(Either.isLeft(result)).toEqual(true);
      if (Either.isLeft(result)) {
        expect(result.left).toBeInstanceOf(ErrorClass);
        expect((result.left as Error).message).toEqual(message);
      }
      expect(context.photoStorage.photoList).toEqual([]);
    },
  };
};
