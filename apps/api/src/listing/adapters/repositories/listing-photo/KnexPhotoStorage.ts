import type { Knex } from 'knex';

import {
  isPhotoFormat,
  ListingPhoto,
} from '../../../domain/entities/ListingPhoto';
import { PhotoStorage } from '../../../domain/ports/PhotoStorage';
import { SchemaPhotoStorage } from './SchemaPhotoStorage';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isUuid = (value: string): boolean => UUID_PATTERN.test(value);

export class KnexPhotoStorage implements PhotoStorage {
  private readonly tableName = 'listing_photos';

  constructor(private readonly connection: Knex<SchemaPhotoStorage>) {}

  public async store(photo: ListingPhoto): Promise<void> {
    const state = photo.toState();
    await this.connection<SchemaPhotoStorage>(this.tableName).insert({
      id: state.id,
      owner_id: state.ownerId,
      format: state.format,
      bytes: Buffer.from(state.bytes),
      uploaded_at: state.uploadedAt,
    });
  }

  public async findById(photoId: string): Promise<ListingPhoto | null> {
    if (!isUuid(photoId)) return null;
    const row = await this.connection<SchemaPhotoStorage>(this.tableName)
      .where({ id: photoId })
      .first();
    return row ? KnexPhotoStorage.toEntity(row) : null;
  }

  public async findIdsOwnedBy(
    ownerId: string,
    photoIds: string[],
  ): Promise<string[]> {
    const candidates = photoIds.filter(isUuid);
    if (candidates.length === 0) return [];
    const rows = await this.connection<SchemaPhotoStorage>(this.tableName)
      .where({ owner_id: ownerId })
      .whereIn('id', candidates)
      .select('id');
    const owned = new Set(rows.map((row) => row.id.toLowerCase()));
    return photoIds.filter((photoId) => owned.has(photoId.toLowerCase()));
  }

  private static toEntity(row: SchemaPhotoStorage): ListingPhoto {
    if (!isPhotoFormat(row.format))
      throw new Error(`Unknown photo format: ${row.format}`);
    return ListingPhoto.fromState({
      id: row.id,
      ownerId: row.owner_id,
      format: row.format,
      bytes: new Uint8Array(row.bytes),
      uploadedAt: new Date(row.uploaded_at),
    });
  }
}
