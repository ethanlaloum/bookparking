import type { AccountGateway } from '../app/account/domain/ports/AccountGateway';
import type { SessionGateway } from '../app/auth/domain/ports/SessionGateway';
import type { SessionStore } from '../app/auth/domain/ports/SessionStore';
import type { Clock } from '../app/consent/domain/ports/Clock';
import type { ConsentStore } from '../app/consent/domain/ports/ConsentStore';
import type { GeocodingGateway } from '../app/listing/domain/ports/GeocodingGateway';
import type { ListingGateway } from '../app/listing/domain/ports/ListingGateway';
import type { NotificationGateway } from '../app/notification/domain/ports/NotificationGateway';
import type { PayoutGateway } from '../app/payout/domain/ports/PayoutGateway';
import type { PaymentPageNavigator } from '../app/rental/domain/ports/PaymentPageNavigator';
import type { RentalGateway } from '../app/rental/domain/ports/RentalGateway';
import type { RentalTermsGateway } from '../app/rental-terms/domain/ports/RentalTermsGateway';

export interface Dependencies {
  accountGateway: AccountGateway;
  clock: Clock;
  consentStore: ConsentStore;
  geocodingGateway: GeocodingGateway;
  listingGateway: ListingGateway;
  notificationGateway: NotificationGateway;
  paymentPageNavigator: PaymentPageNavigator;
  payoutGateway: PayoutGateway;
  rentalGateway: RentalGateway;
  rentalTermsGateway: RentalTermsGateway;
  sessionGateway: SessionGateway;
  sessionStore: SessionStore;
}
