import type { Observable } from 'rxjs';

import type { Account } from '../entities/Account';
import type { HumanChallenge, HumanProof } from '../entities/HumanProof';

export interface RegisterAccountPayload {
  email: string;
  password: string;
  humanProof: HumanProof;
  acceptsTerms: boolean;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface AccountGateway {
  register(payload: RegisterAccountPayload): Observable<Account>;
  getHumanChallenge(): Observable<HumanChallenge>;
  changePassword(payload: ChangePasswordPayload): Observable<void>;
}
