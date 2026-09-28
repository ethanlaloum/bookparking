import type { Observable } from 'rxjs';

import type { PayoutSummary } from '../entities/Payout';

export interface PayoutGateway {
  read(): Observable<PayoutSummary>;
  // Des pages de Stripe, valables quelques minutes : l'api rend l'adresse.
  onboardingLink(): Observable<string>;
  dashboardLink(): Observable<string>;
}
