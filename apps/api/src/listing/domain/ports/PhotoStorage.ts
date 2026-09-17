import { Either } from 'effect/index';

import { PhotoStorageFailedError } from '../usecases/publish-listing/errors/PhotoStorageFailedError';

export interface PhotoStorage {
  storeAll(
    photos: string[],
  ): Promise<Either.Either<void, PhotoStorageFailedError>>;
}
