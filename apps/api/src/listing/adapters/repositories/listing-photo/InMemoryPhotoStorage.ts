import { ListingPhoto } from '../../../domain/entities/ListingPhoto';
import { PhotoStorage } from '../../../domain/ports/PhotoStorage';

export class InMemoryPhotoStorage implements PhotoStorage {
  public photoList: ListingPhoto[] = [];

  public async store(photo: ListingPhoto): Promise<void> {
    this.photoList.push(photo);
  }

  public async findById(photoId: string): Promise<ListingPhoto | null> {
    return this.photoList.find((photo) => photo.id === photoId) ?? null;
  }

  public async findIdsOwnedBy(
    ownerId: string,
    photoIds: string[],
  ): Promise<string[]> {
    return photoIds.filter((photoId) =>
      this.photoList.some(
        (photo) => photo.id === photoId && photo.toState().ownerId === ownerId,
      ),
    );
  }
}
