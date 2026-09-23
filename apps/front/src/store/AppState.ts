import type { AccountState } from '../app/account/store/AccountSlice';
import type { AuthState } from '../app/auth/store/AuthSlice';
import type { BackOfficeState } from '../app/back-office/store/BackOfficeSlice';
import type { ConsentState } from '../app/consent/store/ConsentSlice';
import type { ListingState } from '../app/listing/store/ListingSlice';
import type { RentalState } from '../app/rental/store/RentalSlice';

export interface CoreState {
  account: AccountState;
  auth: AuthState;
  backOffice: BackOfficeState;
  consent: ConsentState;
  listing: ListingState;
  rental: RentalState;
}

export interface AppState {
  core: CoreState;
}
