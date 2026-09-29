import type { Observable } from 'rxjs';

import type { RentalTerms } from '../entities/RentalTerms';

export interface RentalTermsGateway {
  read(): Observable<RentalTerms>;
}
