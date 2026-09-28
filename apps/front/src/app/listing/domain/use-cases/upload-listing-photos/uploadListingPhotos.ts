import { forkJoin, of, type Observable } from 'rxjs';

import type { PhotoDraft } from '../../entities/ListingPhoto';
import type { ListingGateway } from '../../ports/ListingGateway';

export const uploadListingPhotos = (
  drafts: PhotoDraft[],
  listingGateway: ListingGateway,
): Observable<string[]> =>
  drafts.length === 0
    ? of([])
    : forkJoin(
        drafts.map((draft) =>
          draft.kind === 'stored' ? of(draft.id) : listingGateway.uploadPhoto(draft.photo),
        ),
      );
