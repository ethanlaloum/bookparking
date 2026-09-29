import { map, type Observable } from 'rxjs';

import type { HttpClient } from '../../../lib/http/HttpClient';
import type { RentalTerms } from '../domain/entities/RentalTerms';
import type { RentalTermsGateway } from '../domain/ports/RentalTermsGateway';

export class BookparkingRxRentalTermsGateway implements RentalTermsGateway {
  constructor(private readonly httpClient: HttpClient) {}

  read(): Observable<RentalTerms> {
    return this.httpClient.get<RentalTerms>('/rental-terms').pipe(map((response) => response.data));
  }
}
