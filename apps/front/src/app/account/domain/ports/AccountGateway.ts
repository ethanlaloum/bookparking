import type { Observable } from 'rxjs';

import type { Account } from '../entities/Account';

export interface RegisterAccountPayload {
  email: string;
  password: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface AccountGateway {
  register(payload: RegisterAccountPayload): Observable<Account>;
  changePassword(payload: ChangePasswordPayload): Observable<void>;
}
