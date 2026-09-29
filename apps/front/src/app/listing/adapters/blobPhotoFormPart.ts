import type { LocalPhoto } from '../domain/entities/ListingPhoto';

export const blobPhotoFormPart = async (photo: LocalPhoto): Promise<Blob> => {
  const response = await fetch(photo.uri);
  return response.blob();
};
