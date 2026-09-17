import { Either } from 'effect/index';

import { PhotoStorage } from '../../../domain/ports/PhotoStorage';
import { PhotoStorageFailedError } from '../../../domain/usecases/publish-listing/errors/PhotoStorageFailedError';

export class InMemoryPhotoStorage implements PhotoStorage {
  public storedPhotoList: string[] = [];
  private failing = false;

  public enableFailureOnEveryUpload(): void {
    this.failing = true;
  }

  public disableFailureOnEveryUpload(): void {
    this.failing = false;
  }

  public async storeAll(
    photos: string[],
  ): Promise<Either.Either<void, PhotoStorageFailedError>> {
    if (this.failing) return Either.left(new PhotoStorageFailedError());
    this.storedPhotoList.push(...photos);
    return Either.right(undefined);
  }
}
