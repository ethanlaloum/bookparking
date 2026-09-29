import type { Observable } from 'rxjs';

import type { components } from '../../../../api/schema';
import type { Listing } from '../entities/Listing';
import type { LocalPhoto } from '../entities/ListingPhoto';
import type { SearchedStay } from '../entities/SearchCriteria';

export type OwnerListing = components['schemas']['OwnerListing'];
export type PublishListingPayload = components['schemas']['PublishListingRequest'];
export type EditListingPayload = components['schemas']['EditListingRequest'];

export interface ListingGateway {
  listActive(): Observable<Listing[]>;
  listFree(stay: SearchedStay): Observable<Listing[]>;
  listMine(): Observable<OwnerListing[]>;
  getById(id: string): Observable<Listing>;
  publish(payload: PublishListingPayload): Observable<void>;
  unpublish(id: string): Observable<void>;
  edit(id: string, listing: EditListingPayload): Observable<OwnerListing>;
  uploadPhoto(photo: LocalPhoto): Observable<string>;
}
