import { from, map, switchMap, type Observable } from 'rxjs';

import type { HttpClient, HttpResponse } from '../../../lib/http/HttpClient';
import type { components } from '../../../api/schema';
import type { Listing } from '../domain/entities/Listing';
import type { LocalPhoto } from '../domain/entities/ListingPhoto';
import type { SearchedStay } from '../domain/entities/SearchCriteria';
import type {
  EditListingPayload,
  ListingGateway,
  OwnerListing,
  PublishListingPayload,
} from '../domain/ports/ListingGateway';

type UploadedListingPhoto = components['schemas']['UploadedListingPhoto'];

export type PhotoFormPart = (photo: LocalPhoto) => Promise<Blob | LocalPhoto>;

export class BookparkingRxListingGateway implements ListingGateway {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly photoFormPart: PhotoFormPart,
  ) {}

  listActive(): Observable<Listing[]> {
    return this.httpClient
      .get<Listing[]>('/listing')
      .pipe(map((response: HttpResponse<Listing[]>) => response.data));
  }

  listFree(stay: SearchedStay): Observable<Listing[]> {
    const query = new URLSearchParams({ fromDay: stay.from, toDay: stay.to }).toString();
    return this.httpClient
      .get<Listing[]>(`/listing?${query}`)
      .pipe(map((response: HttpResponse<Listing[]>) => response.data));
  }

  listMine(): Observable<OwnerListing[]> {
    return this.httpClient
      .get<OwnerListing[]>('/listing/mine')
      .pipe(map((response: HttpResponse<OwnerListing[]>) => response.data));
  }

  getById(id: string): Observable<Listing> {
    return this.httpClient
      .get<Listing>(`/listing/${encodeURIComponent(id)}`)
      .pipe(map((response: HttpResponse<Listing>) => response.data));
  }

  publish(payload: PublishListingPayload): Observable<void> {
    return this.httpClient.post<void>('/listing', payload).pipe(map(() => undefined));
  }

  unpublish(id: string): Observable<void> {
    return this.httpClient
      .delete<void>(`/listing/${encodeURIComponent(id)}`)
      .pipe(map(() => undefined));
  }

  edit(id: string, listing: EditListingPayload): Observable<OwnerListing> {
    return this.httpClient
      .patch<OwnerListing>(`/listing/${encodeURIComponent(id)}`, listing)
      .pipe(map((response: HttpResponse<OwnerListing>) => response.data));
  }

  uploadPhoto(photo: LocalPhoto): Observable<string> {
    return from(this.photoFormPart(photo)).pipe(
      switchMap((part) => {
        const form = new FormData();
        form.append('photo', part as Blob, photo.name);
        return this.httpClient.postForm<UploadedListingPhoto>('/listing/photo', form);
      }),
      map((response: HttpResponse<UploadedListingPhoto>) => response.data.id),
    );
  }
}
