import { Either } from 'effect/index';

import { UnknownError } from '../../../../shared/error/errors/UnknownError';
import { UseCase } from '../../../../shared/use-case/UseCase';
import { ListingPhoto } from '../../entities/ListingPhoto';
import { PhotoTooLargeError } from '../../errors/PhotoTooLargeError';
import { UnsupportedPhotoFormatError } from '../../errors/UnsupportedPhotoFormatError';
import { PhotoStorage } from '../../ports/PhotoStorage';

interface Props {
  ownerId: string;
  bytes: Uint8Array;
  uploadedAt: Date;
}

export type UploadListingPhotoError =
  PhotoTooLargeError | UnsupportedPhotoFormatError | UnknownError;

export class UploadListingPhoto implements UseCase<
  Props,
  Promise<Either.Either<ListingPhoto, UploadListingPhotoError>>
> {
  constructor(private readonly photoStorage: PhotoStorage) {}

  public async execute(
    props: Props,
  ): Promise<Either.Either<ListingPhoto, UploadListingPhotoError>> {
    try {
      const upload = ListingPhoto.upload(props);
      if (Either.isLeft(upload)) return Either.left(upload.left);

      await this.photoStorage.store(upload.right);
      return Either.right(upload.right);
    } catch (error: unknown) {
      return Either.left(
        new UnknownError(
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
  }
}
