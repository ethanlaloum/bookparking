import { RentalPlace } from '../entities/RentalPlace';
import { RentalPricing } from '../services/computeRentalPrice';

export interface PublishedListing {
  address: string;
  box: string;
  pricing: RentalPricing;
}

export interface PublishedListingReader {
  findPublishedByPlace(place: RentalPlace): Promise<PublishedListing | null>;
}
