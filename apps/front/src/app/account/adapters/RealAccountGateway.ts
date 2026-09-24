import { map, type Observable } from 'rxjs';

import type { HttpClient, HttpResponse } from '../../../lib/http/HttpClient';
import type { Account } from '../domain/entities/Account';
import type { HumanChallenge } from '../domain/entities/HumanProof';
import type {
  AccountGateway,
  ChangePasswordPayload,
  RegisterAccountPayload,
} from '../domain/ports/AccountGateway';

export class BookparkingRxAccountGateway implements AccountGateway {
  constructor(private readonly httpClient: HttpClient) {}

  register(payload: RegisterAccountPayload): Observable<Account> {
    return this.httpClient
      .post<Account>('/account', payload)
      .pipe(map((response: HttpResponse<Account>) => response.data));
  }

  getHumanChallenge(): Observable<HumanChallenge> {
    return this.httpClient
      .get<HumanChallenge>('/account/human-challenge')
      .pipe(map((response: HttpResponse<HumanChallenge>) => response.data));
  }

  changePassword(payload: ChangePasswordPayload): Observable<void> {
    return this.httpClient.post<void>('/account/password', payload).pipe(map(() => undefined));
  }
}
