import { ListingPhoto } from '../entities/ListingPhoto';

export interface PhotoStorage {
  store(photo: ListingPhoto): Promise<void>;
  findById(photoId: string): Promise<ListingPhoto | null>;
  findIdsOwnedBy(ownerId: string, photoIds: string[]): Promise<string[]>;
}
