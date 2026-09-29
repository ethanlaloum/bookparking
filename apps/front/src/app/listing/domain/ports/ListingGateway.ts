import type { Observable } from 'rxjs';

import type { components } from '../../../../api/schema';
import type { Listing } from '../entities/Listing';

export type OwnerListing = components['schemas']['OwnerListing'];
export type PublishListingPayload = components['schemas']['PublishListingRequest'];
export type UpdatePricingPayload = components['schemas']['UpdateListingPricingRequest'];

export interface ListingGateway {
  listActive(): Observable<Listing[]>;
  listMine(): Observable<OwnerListing[]>;
  getById(id: string): Observable<Listing>;
  publish(payload: PublishListingPayload): Observable<void>;
  unpublish(id: string): Observable<void>;
  updatePricing(id: string, pricing: UpdatePricingPayload): Observable<Listing>;
}
