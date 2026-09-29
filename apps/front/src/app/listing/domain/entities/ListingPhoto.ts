import type { components } from '../../../../api/schema';

export interface LocalPhoto {
  uri: string;
  name: string;
  type: string;
}

export type PhotoDraft = { kind: 'stored'; id: string } | { kind: 'local'; photo: LocalPhoto };

export type ListingContentDraft = Omit<components['schemas']['EditListingRequest'], 'photos'> & {
  photos: PhotoDraft[];
};

export type PublishListingDraft = Omit<components['schemas']['PublishListingRequest'], 'photos'> & {
  photos: PhotoDraft[];
};

export const MAX_PHOTOS_PER_LISTING = 10;
export const MAX_PHOTO_SIZE_IN_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const UPLOADED_PHOTO_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const listingPhotoUrl = (apiBaseUrl: string, photoId: string): string | null =>
  UPLOADED_PHOTO_ID.test(photoId) ? `${apiBaseUrl}/listing/photo/${photoId}` : null;

export const photoDraftSourceOf = (apiBaseUrl: string, draft: PhotoDraft): string | null =>
  draft.kind === 'local' ? draft.photo.uri : listingPhotoUrl(apiBaseUrl, draft.id);

export const coverPhotoUrlOf = (apiBaseUrl: string, photoIds: string[]): string | null =>
  photoIds.map((id) => listingPhotoUrl(apiBaseUrl, id)).find((url) => url !== null) ?? null;

export const storedPhotoDraftsOf = (photoIds: string[]): PhotoDraft[] =>
  photoIds.map((id) => ({ kind: 'stored', id }));

export const withAddedPhotos = (drafts: PhotoDraft[], added: LocalPhoto[]): PhotoDraft[] =>
  [...drafts, ...added.map((photo): PhotoDraft => ({ kind: 'local', photo }))].slice(
    0,
    MAX_PHOTOS_PER_LISTING,
  );

export const withoutPhotoAt = (drafts: PhotoDraft[], index: number): PhotoDraft[] =>
  drafts.filter((_, position) => position !== index);

export const photoDraftKeyOf = (draft: PhotoDraft): string =>
  draft.kind === 'stored' ? draft.id : draft.photo.uri;
