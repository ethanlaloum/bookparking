import { map, type Observable } from 'rxjs';

import type { HttpClient } from '../../../lib/http/HttpClient';
import type { PayoutSummary } from '../domain/entities/Payout';
import type { PayoutGateway } from '../domain/ports/PayoutGateway';

export class BookparkingRxPayoutGateway implements PayoutGateway {
  constructor(private readonly httpClient: HttpClient) {}

  read(): Observable<PayoutSummary> {
    return this.httpClient.get<PayoutSummary>('/payout').pipe(map((response) => response.data));
  }

  onboardingLink(): Observable<string> {
    return this.httpClient
      .post<{ url: string }>('/payout/onboarding')
      .pipe(map((response) => response.data.url));
  }

  dashboardLink(): Observable<string> {
    return this.httpClient
      .post<{ url: string }>('/payout/dashboard')
      .pipe(map((response) => response.data.url));
  }
}
