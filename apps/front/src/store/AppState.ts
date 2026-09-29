import type { AccountState } from '../app/account/store/AccountSlice';
import type { AuthState } from '../app/auth/store/AuthSlice';
import type { ListingState } from '../app/listing/store/ListingSlice';
import type { RentalState } from '../app/rental/store/RentalSlice';

export interface CoreState {
  account: AccountState;
  auth: AuthState;
  listing: ListingState;
  rental: RentalState;
}

export interface AppState {
  core: CoreState;
}
