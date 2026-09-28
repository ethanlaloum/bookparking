import { Either } from 'effect/index';

import { InMemoryPhotoStorage } from '../../../adapters/repositories/listing-photo/InMemoryPhotoStorage';
import { ListingPhotoBuilder } from '../../builders/ListingPhotoBuilder';
import { ListingPhoto } from '../../entities/ListingPhoto';
import { GetListingPhoto } from './GetListingPhoto';

export const createGetListingPhotoSUT = () => {
  const photoStorage = new InMemoryPhotoStorage();
  const getListingPhoto = new GetListingPhoto(photoStorage);

  const context = { photoStorage, getListingPhoto };

  return {
    context,

    givenStoredPhoto(photoId: string) {
      const photo = new ListingPhotoBuilder().withId(photoId).build();
      context.photoStorage.photoList.push(photo);
      return { photo };
    },

    async whenReading(photoId: string) {
      return context.getListingPhoto.execute({ photoId });
    },

    thenPhotoReadIs(
      result: Either.Either<ListingPhoto, unknown>,
      expected: ListingPhoto,
    ) {
      expect(Either.isRight(result)).toEqual(true);
      if (Either.isRight(result))
        expect(result.right.toState()).toEqual(expected.toState());
    },

    thenReadIsRefusedWith(
      result: Either.Either<unknown, unknown>,
      ErrorClass: new (...args: never[]) => Error,
      message: string,
    ) {
      expect(Either.isLeft(result)).toEqual(true);
      if (Either.isLeft(result)) {
        expect(result.left).toBeInstanceOf(ErrorClass);
        expect((result.left as Error).message).toEqual(message);
      }
    },
  };
};
