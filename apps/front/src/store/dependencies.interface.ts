import type { AccountGateway } from '../app/account/domain/ports/AccountGateway';
import type { SessionGateway } from '../app/auth/domain/ports/SessionGateway';
import type { SessionStore } from '../app/auth/domain/ports/SessionStore';
import type { GeocodingGateway } from '../app/listing/domain/ports/GeocodingGateway';
import type { ListingGateway } from '../app/listing/domain/ports/ListingGateway';
import type { RentalGateway } from '../app/rental/domain/ports/RentalGateway';

export interface Dependencies {
  accountGateway: AccountGateway;
  geocodingGateway: GeocodingGateway;
  listingGateway: ListingGateway;
  rentalGateway: RentalGateway;
  sessionGateway: SessionGateway;
  sessionStore: SessionStore;
}
