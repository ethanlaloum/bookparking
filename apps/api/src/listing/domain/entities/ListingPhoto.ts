import { randomUUID } from 'node:crypto';

import { Either } from 'effect/index';

import { PhotoTooLargeError } from '../errors/PhotoTooLargeError';
import { UnsupportedPhotoFormatError } from '../errors/UnsupportedPhotoFormatError';

export const MAX_PHOTO_SIZE_IN_BYTES = 10 * 1024 * 1024;

export enum PhotoFormat {
  JPEG = 'image/jpeg',
  PNG = 'image/png',
  WEBP = 'image/webp',
}

export const isPhotoFormat = (value: string): value is PhotoFormat =>
  (Object.values(PhotoFormat) as string[]).includes(value);

const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const RIFF_SIGNATURE = [0x52, 0x49, 0x46, 0x46];
const WEBP_SIGNATURE = [0x57, 0x45, 0x42, 0x50];
const WEBP_SIGNATURE_OFFSET = 8;

const startsWith = (
  bytes: Uint8Array,
  signature: number[],
  offset = 0,
): boolean => signature.every((byte, index) => bytes[offset + index] === byte);

const formatOf = (bytes: Uint8Array): PhotoFormat | null => {
  if (startsWith(bytes, JPEG_SIGNATURE)) return PhotoFormat.JPEG;
  if (startsWith(bytes, PNG_SIGNATURE)) return PhotoFormat.PNG;
  if (
    startsWith(bytes, RIFF_SIGNATURE) &&
    startsWith(bytes, WEBP_SIGNATURE, WEBP_SIGNATURE_OFFSET)
  )
    return PhotoFormat.WEBP;
  return null;
};

interface Props {
  id: string;
  ownerId: string;
  format: PhotoFormat;
  bytes: Uint8Array;
  uploadedAt: Date;
}

export class ListingPhoto {
  private constructor(private readonly props: Props) {}

  public toState(): Props {
    return this.props;
  }

  public static fromState(state: Props): ListingPhoto {
    return new ListingPhoto(state);
  }

  public static upload(params: {
    ownerId: string;
    bytes: Uint8Array;
    uploadedAt: Date;
  }): Either.Either<
    ListingPhoto,
    PhotoTooLargeError | UnsupportedPhotoFormatError
  > {
    if (params.bytes.length > MAX_PHOTO_SIZE_IN_BYTES)
      return Either.left(new PhotoTooLargeError());
    const format = formatOf(params.bytes);
    if (format === null) return Either.left(new UnsupportedPhotoFormatError());
    return Either.right(
      new ListingPhoto({
        id: randomUUID(),
        ownerId: params.ownerId,
        format,
        bytes: params.bytes,
        uploadedAt: params.uploadedAt,
      }),
    );
  }

  public get id(): string {
    return this.props.id;
  }
}
