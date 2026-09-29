import type { AuthState } from '../app/auth/store/AuthSlice';
import type { BackOfficeState } from '../app/back-office/store/BackOfficeSlice';

export interface CoreState {
  auth: AuthState;
  backOffice: BackOfficeState;
}

export interface AppState {
  core: CoreState;
}
