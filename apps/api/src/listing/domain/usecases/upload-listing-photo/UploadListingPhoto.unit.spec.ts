import {
  MAX_PHOTO_SIZE_IN_BYTES,
  PhotoFormat,
} from '../../entities/ListingPhoto';
import { PhotoTooLargeError } from '../../errors/PhotoTooLargeError';
import { UnsupportedPhotoFormatError } from '../../errors/UnsupportedPhotoFormatError';
import { createUploadListingPhotoSUT } from './UploadListingPhoto.sut';

const JPEG = Uint8Array.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46,
]);
const PNG = Uint8Array.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
]);
const WEBP = Uint8Array.from([
  0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50, 0x56,
  0x50, 0x38, 0x20,
]);
const GIF = Uint8Array.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00]);
const RIFF_WAVE = Uint8Array.from([
  0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x41, 0x56, 0x45,
]);
const HTML_CLAIMING_JPEG = new TextEncoder().encode(
  '<html><script>alert(1)</script></html>',
);

const jpegOfSize = (size: number): Uint8Array => {
  const bytes = new Uint8Array(size);
  bytes.set(JPEG);
  return bytes;
};

const FORMAT_MESSAGE = 'Une photo doit être au format JPEG, PNG ou WebP';

describe('UploadListingPhoto', () => {
  it('stores a JPEG under a new identifier, for its owner', async () => {
    const sut = createUploadListingPhotoSUT();

    const result = await sut.whenUploading(JPEG);

    sut.thenStoredPhotoIs(result, { format: PhotoFormat.JPEG, bytes: JPEG });
  });

  it('recognises a PNG by its first bytes', async () => {
    const sut = createUploadListingPhotoSUT();

    const result = await sut.whenUploading(PNG);

    sut.thenStoredPhotoIs(result, { format: PhotoFormat.PNG, bytes: PNG });
  });

  it('recognises a WebP by its first bytes', async () => {
    const sut = createUploadListingPhotoSUT();

    const result = await sut.whenUploading(WEBP);

    sut.thenStoredPhotoIs(result, { format: PhotoFormat.WEBP, bytes: WEBP });
  });

  it('accepts a photo of exactly 10 MB', async () => {
    const sut = createUploadListingPhotoSUT();
    const photo = jpegOfSize(MAX_PHOTO_SIZE_IN_BYTES);

    const result = await sut.whenUploading(photo);

    sut.thenStoredPhotoIs(result, { format: PhotoFormat.JPEG, bytes: photo });
  });

  it('refuses a photo one byte above 10 MB', async () => {
    const sut = createUploadListingPhotoSUT();

    const result = await sut.whenUploading(
      jpegOfSize(MAX_PHOTO_SIZE_IN_BYTES + 1),
    );

    sut.thenUploadIsRefusedWith(
      result,
      PhotoTooLargeError,
      'Une photo ne doit pas dépasser 10 Mo',
    );
  });

  it('refuses a GIF', async () => {
    const sut = createUploadListingPhotoSUT();

    const result = await sut.whenUploading(GIF);

    sut.thenUploadIsRefusedWith(
      result,
      UnsupportedPhotoFormatError,
      FORMAT_MESSAGE,
    );
  });

  it('refuses a RIFF file that is not a WebP', async () => {
    const sut = createUploadListingPhotoSUT();

    const result = await sut.whenUploading(RIFF_WAVE);

    sut.thenUploadIsRefusedWith(
      result,
      UnsupportedPhotoFormatError,
      FORMAT_MESSAGE,
    );
  });

  it('refuses an HTML page, whatever type the client claimed', async () => {
    const sut = createUploadListingPhotoSUT();

    const result = await sut.whenUploading(HTML_CLAIMING_JPEG);

    sut.thenUploadIsRefusedWith(
      result,
      UnsupportedPhotoFormatError,
      FORMAT_MESSAGE,
    );
  });

  it('refuses an empty file', async () => {
    const sut = createUploadListingPhotoSUT();

    const result = await sut.whenUploading(new Uint8Array(0));

    sut.thenUploadIsRefusedWith(
      result,
      UnsupportedPhotoFormatError,
      FORMAT_MESSAGE,
    );
  });
});
