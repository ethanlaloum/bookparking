import {
  ACCEPTED_PHOTO_TYPES,
  MAX_PHOTO_SIZE_IN_BYTES,
  type LocalPhoto,
} from '../app/listing/domain/entities/ListingPhoto';

const LONGEST_SIDE_IN_PIXELS = 2048;
const JPEG_QUALITY = 0.85;

export type PreparedPhoto = { photo: LocalPhoto } | { refusal: 'format' | 'size' };

const jpegNameOf = (name: string): string => `${name.replace(/\.[^.]*$/u, '') || 'photo'}.jpg`;

const reencodedAsJpeg = async (file: File): Promise<Blob | null> => {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const ratio = Math.min(1, LONGEST_SIDE_IN_PIXELS / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * ratio);
    canvas.height = Math.round(bitmap.height * ratio);
    const context = canvas.getContext('2d');
    if (context === null) return null;
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY));
  } catch {
    return null;
  }
};

const localPhotoOf = (blob: Blob, name: string, type: string): LocalPhoto => ({
  uri: URL.createObjectURL(blob),
  name,
  type,
});

export const preparePhoto = async (file: File): Promise<PreparedPhoto> => {
  const reencoded = await reencodedAsJpeg(file);
  if (reencoded !== null && reencoded.size <= MAX_PHOTO_SIZE_IN_BYTES)
    return { photo: localPhotoOf(reencoded, jpegNameOf(file.name), 'image/jpeg') };
  if (!ACCEPTED_PHOTO_TYPES.includes(file.type)) return { refusal: 'format' };
  if (file.size > MAX_PHOTO_SIZE_IN_BYTES) return { refusal: 'size' };
  return { photo: localPhotoOf(file, file.name, file.type) };
};

export const forgetLocalPhoto = (photo: LocalPhoto): void => {
  URL.revokeObjectURL(photo.uri);
};
