import type { AccountState } from '../app/account/store/AccountSlice';
import type { AuthState } from '../app/auth/store/AuthSlice';
import type { ConsentState } from '../app/consent/store/ConsentSlice';
import type { ListingState } from '../app/listing/store/ListingSlice';
import type { NotificationState } from '../app/notification/store/NotificationSlice';
import type { PayoutState } from '../app/payout/store/PayoutSlice';
import type { RentalState } from '../app/rental/store/RentalSlice';
import type { RentalTermsState } from '../app/rental-terms/store/RentalTermsSlice';

export interface CoreState {
  account: AccountState;
  auth: AuthState;
  consent: ConsentState;
  listing: ListingState;
  notification: NotificationState;
  payout: PayoutState;
  rental: RentalState;
  rentalTerms: RentalTermsState;
}

export interface AppState {
  core: CoreState;
}
