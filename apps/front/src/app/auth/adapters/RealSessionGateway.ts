import { catchError, map, type Observable } from 'rxjs';

import type { components } from '../../../api/schema';
import type { HttpClient, HttpResponse } from '../../../lib/http/HttpClient';
import type { Session } from '../domain/entities/Session';
import type { Credentials, SessionGateway } from '../domain/ports/SessionGateway';

type SignInResponse = components['schemas']['SignInResponse'];

export class BookparkingRxSessionGateway implements SessionGateway {
  constructor(private readonly httpClient: HttpClient) {}

  signIn(credentials: Credentials): Observable<Session> {
    return this.httpClient.post<SignInResponse>('/session', credentials).pipe(
      map((response: HttpResponse<SignInResponse>) => ({
        token: response.data.token,
        validUntil: response.data.validUntil,
      })),
      catchError((error: Error) => {
        throw error;
      }),
    );
  }
}
