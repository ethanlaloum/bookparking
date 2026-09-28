import { Either } from 'effect/index';

import { UnknownError } from '../../../../shared/error/errors/UnknownError';
import { UseCase } from '../../../../shared/use-case/UseCase';
import { ListingPhoto } from '../../entities/ListingPhoto';
import { PhotoStorage } from '../../ports/PhotoStorage';
import { ListingPhotoNotFoundError } from './errors/ListingPhotoNotFoundError';

interface Props {
  photoId: string;
}

export type GetListingPhotoError = ListingPhotoNotFoundError | UnknownError;

export class GetListingPhoto implements UseCase<
  Props,
  Promise<Either.Either<ListingPhoto, GetListingPhotoError>>
> {
  constructor(private readonly photoStorage: PhotoStorage) {}

  public async execute(
    props: Props,
  ): Promise<Either.Either<ListingPhoto, GetListingPhotoError>> {
    try {
      const photo = await this.photoStorage.findById(props.photoId);
      if (photo === null) return Either.left(new ListingPhotoNotFoundError());
      return Either.right(photo);
    } catch (error: unknown) {
      return Either.left(
        new UnknownError(
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
  }
}
