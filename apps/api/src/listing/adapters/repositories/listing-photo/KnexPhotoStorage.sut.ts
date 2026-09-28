import { getTestDbConnection } from '../../../../infra/testcontainers-setup';
import { ListingPhotoBuilder } from '../../../domain/builders/ListingPhotoBuilder';
import {
  ListingPhoto,
  PhotoFormat,
} from '../../../domain/entities/ListingPhoto';
import { KnexPhotoStorage } from './KnexPhotoStorage';
import { SchemaPhotoStorage } from './SchemaPhotoStorage';

export const createKnexPhotoStorageSUT = () => {
  const testDbConnection = getTestDbConnection();
  const photoStorage = new KnexPhotoStorage(testDbConnection);

  const context = { testDbConnection, photoStorage };

  return {
    context,

    async givenStoredPhoto(params: {
      id: string;
      ownerId: string;
      format?: PhotoFormat;
      bytes?: Uint8Array;
    }) {
      const builder = new ListingPhotoBuilder()
        .withId(params.id)
        .withOwnerId(params.ownerId);
      const withFormat = params.format
        ? builder.withFormat(params.format)
        : builder;
      const photo = (
        params.bytes ? withFormat.withBytes(params.bytes) : withFormat
      ).build();
      await context.photoStorage.store(photo);
      return { photo };
    },

    async whenReading(photoId: string) {
      return context.photoStorage.findById(photoId);
    },

    async whenFindingIdsOwnedBy(ownerId: string, photoIds: string[]) {
      return context.photoStorage.findIdsOwnedBy(ownerId, photoIds);
    },

    thenPhotoReadIs(read: ListingPhoto | null, expected: ListingPhoto) {
      expect(read?.toState()).toEqual(expected.toState());
    },

    async thenStoredRowIs(expected: {
      id: string;
      owner_id: string;
      format: string;
      bytes: number[];
      uploaded_at: string;
    }) {
      const rows = (await context
        .testDbConnection<SchemaPhotoStorage>('listing_photos')
        .select('*')) as SchemaPhotoStorage[];
      expect(
        rows.map((row) => ({
          ...row,
          bytes: [...row.bytes],
          uploaded_at: new Date(row.uploaded_at).toISOString(),
        })),
      ).toEqual([expected]);
    },
  };
};
