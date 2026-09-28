import type { LocalPhoto } from '@front/app/listing/domain/entities/ListingPhoto';

export const nativePhotoFormPart = (photo: LocalPhoto): Promise<LocalPhoto> => Promise.resolve(photo);
