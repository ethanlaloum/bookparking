import type { Observable } from 'rxjs';

import type { Session } from '../entities/Session';

export interface Credentials {
  email: string;
  password: string;
}

export interface SessionGateway {
  signIn(credentials: Credentials): Observable<Session>;
}
