import type { AccountGateway } from '../app/account/domain/ports/AccountGateway';
import type { SessionGateway } from '../app/auth/domain/ports/SessionGateway';
import type { BackOfficeGateway } from '../app/back-office/domain/ports/BackOfficeGateway';
import type { SessionStore } from '../app/auth/domain/ports/SessionStore';
import type { Clock } from '../app/consent/domain/ports/Clock';
import type { ConsentStore } from '../app/consent/domain/ports/ConsentStore';
import type { GeocodingGateway } from '../app/listing/domain/ports/GeocodingGateway';
import type { ListingGateway } from '../app/listing/domain/ports/ListingGateway';
import type { RentalGateway } from '../app/rental/domain/ports/RentalGateway';

export interface Dependencies {
  accountGateway: AccountGateway;
  backOfficeGateway: BackOfficeGateway;
  clock: Clock;
  consentStore: ConsentStore;
  geocodingGateway: GeocodingGateway;
  listingGateway: ListingGateway;
  rentalGateway: RentalGateway;
  sessionGateway: SessionGateway;
  sessionStore: SessionStore;
}
