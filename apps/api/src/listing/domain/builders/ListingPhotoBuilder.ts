import { randomUUID } from 'node:crypto';

import { ListingPhoto, PhotoFormat } from '../entities/ListingPhoto';

export const JPEG_BYTES = Uint8Array.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
]);

export class ListingPhotoBuilder {
  private state: ListingPhoto;

  constructor() {
    this.state = ListingPhoto.fromState({
      id: randomUUID(),
      ownerId: 'account-marc',
      format: PhotoFormat.JPEG,
      bytes: JPEG_BYTES,
      uploadedAt: new Date('2026-09-10T00:00:00.000Z'),
    });
  }

  withId(id: string): ListingPhotoBuilder {
    this.state = ListingPhoto.fromState({ ...this.state.toState(), id });
    return this;
  }

  withOwnerId(ownerId: string): ListingPhotoBuilder {
    this.state = ListingPhoto.fromState({ ...this.state.toState(), ownerId });
    return this;
  }

  withFormat(format: PhotoFormat): ListingPhotoBuilder {
    this.state = ListingPhoto.fromState({ ...this.state.toState(), format });
    return this;
  }

  withBytes(bytes: Uint8Array): ListingPhotoBuilder {
    this.state = ListingPhoto.fromState({ ...this.state.toState(), bytes });
    return this;
  }

  build(): ListingPhoto {
    return this.state;
  }
}
