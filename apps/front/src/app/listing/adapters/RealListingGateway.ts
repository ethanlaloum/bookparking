import { map, type Observable } from 'rxjs';

import type { HttpClient, HttpResponse } from '../../../lib/http/HttpClient';
import type { Listing } from '../domain/entities/Listing';
import type {
  ListingGateway,
  OwnerListing,
  PublishListingPayload,
  UpdatePricingPayload,
} from '../domain/ports/ListingGateway';

export class BookparkingRxListingGateway implements ListingGateway {
  constructor(private readonly httpClient: HttpClient) {}

  listActive(): Observable<Listing[]> {
    return this.httpClient
      .get<Listing[]>('/listing')
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

  updatePricing(id: string, pricing: UpdatePricingPayload): Observable<Listing> {
    return this.httpClient
      .patch<Listing>(`/listing/${encodeURIComponent(id)}/pricing`, pricing)
      .pipe(map((response: HttpResponse<Listing>) => response.data));
  }
}
