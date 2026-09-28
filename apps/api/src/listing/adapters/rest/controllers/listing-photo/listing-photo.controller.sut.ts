import { ModuleMetadata } from '@nestjs/common';
import { Either } from 'effect/index';

import { UnknownError } from '../../../../../shared/error/errors/UnknownError';
import { TestAuthState } from '../../../../../shared/test/http/TestAuthGuard';
import { UseCaseDouble } from '../../../../../shared/test/http/UseCaseDouble';
import { ListingPhotoBuilder } from '../../../../domain/builders/ListingPhotoBuilder';
import {
  ListingPhoto,
  PhotoFormat,
} from '../../../../domain/entities/ListingPhoto';
import { PhotoTooLargeError } from '../../../../domain/errors/PhotoTooLargeError';
import { UnsupportedPhotoFormatError } from '../../../../domain/errors/UnsupportedPhotoFormatError';
import { ListingPhotoNotFoundError } from '../../../../domain/usecases/get-listing-photo/errors/ListingPhotoNotFoundError';
import { GetListingPhoto } from '../../../../domain/usecases/get-listing-photo/GetListingPhoto';
import { UploadListingPhoto } from '../../../../domain/usecases/upload-listing-photo/UploadListingPhoto';
import { ListingPhotoController } from './listing-photo.controller';

export const MARC_ACCOUNT_ID = 'account-marc';

export const createListingPhotoControllerSUT = () => {
  const uploadListingPhoto = new UseCaseDouble<
    { ownerId: string; bytes: Uint8Array; uploadedAt: Date },
    Either.Either<
      ListingPhoto,
      PhotoTooLargeError | UnsupportedPhotoFormatError | UnknownError
    >
  >();
  const getListingPhoto = new UseCaseDouble<
    { photoId: string },
    Either.Either<ListingPhoto, ListingPhotoNotFoundError | UnknownError>
  >();
  const authState: TestAuthState = { user: { id: MARC_ACCOUNT_ID } };

  const metadata: ModuleMetadata = {
    controllers: [ListingPhotoController],
    providers: [
      { provide: UploadListingPhoto, useValue: uploadListingPhoto },
      { provide: GetListingPhoto, useValue: getListingPhoto },
    ],
  };

  return {
    metadata,
    uploadListingPhoto,
    getListingPhoto,
    authState,

    givenUploadSucceedsAs(photoId: string) {
      uploadListingPhoto.willResolve(
        Either.right(new ListingPhotoBuilder().withId(photoId).build()),
      );
    },

    givenUploadIsRefusedWith(
      error: PhotoTooLargeError | UnsupportedPhotoFormatError,
    ) {
      uploadListingPhoto.willResolve(Either.left(error));
    },

    givenStoredPhoto(params: {
      id: string;
      format: PhotoFormat;
      bytes: Uint8Array;
    }) {
      getListingPhoto.willResolve(
        Either.right(
          new ListingPhotoBuilder()
            .withId(params.id)
            .withFormat(params.format)
            .withBytes(params.bytes)
            .build(),
        ),
      );
    },

    givenNoPhoto() {
      getListingPhoto.willResolve(Either.left(new ListingPhotoNotFoundError()));
    },

    thenUploadWasRequestedWith(expected: { ownerId: string; bytes: number[] }) {
      expect(uploadListingPhoto.calls).toHaveLength(1);
      const [call] = uploadListingPhoto.calls;
      expect({ ownerId: call.ownerId, bytes: [...call.bytes] }).toEqual(
        expected,
      );
      expect(call.uploadedAt).toBeInstanceOf(Date);
    },

    thenNothingWasUploaded() {
      expect(uploadListingPhoto.calls).toEqual([]);
    },
  };
};
