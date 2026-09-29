export interface SchemaPhotoStorage {
  id: string;
  owner_id: string;
  format: string;
  bytes: Buffer;
  uploaded_at: Date | string;
}
