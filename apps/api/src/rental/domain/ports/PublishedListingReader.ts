import { CalendarDayRange } from '../entities/CalendarDay';
import { RentalPlace } from '../entities/RentalPlace';
import { RentalPricing } from '../services/computeRentalPrice';

export interface PublishedListing {
  address: string;
  box: string;
  pricing: RentalPricing;
  openDays: CalendarDayRange;
}

export interface PublishedListingReader {
  findPublishedByPlace(place: RentalPlace): Promise<PublishedListing | null>;
}
