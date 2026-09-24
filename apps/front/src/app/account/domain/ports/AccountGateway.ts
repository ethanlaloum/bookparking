import type { Observable } from 'rxjs';

import type { Account, OwnAccount } from '../entities/Account';
import type { Avatar } from '../entities/Avatar';
import type { HumanChallenge, HumanProof } from '../entities/HumanProof';

export interface RegisterAccountPayload {
  email: string;
  password: string;
  humanProof: HumanProof;
  acceptsTerms: boolean;
  avatar: Avatar;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface AccountGateway {
  register(payload: RegisterAccountPayload): Observable<Account>;
  getHumanChallenge(): Observable<HumanChallenge>;
  changePassword(payload: ChangePasswordPayload): Observable<void>;
  readOwnAccount(): Observable<OwnAccount>;
  chooseAvatar(avatar: Avatar): Observable<void>;
}
