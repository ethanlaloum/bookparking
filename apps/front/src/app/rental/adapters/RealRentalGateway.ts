import { map, type Observable } from 'rxjs';

import type { HttpClient, HttpResponse } from '../../../lib/http/HttpClient';
import type { RentalRequestView } from '../domain/entities/RentalRequestView';
import type { RentalGateway, RequestRentalPayload } from '../domain/ports/RentalGateway';

export class BookparkingRxRentalGateway implements RentalGateway {
  constructor(private readonly httpClient: HttpClient) {}

  request(payload: RequestRentalPayload): Observable<void> {
    return this.httpClient.post<void>('/rental-request', payload).pipe(map(() => undefined));
  }

  listMine(): Observable<RentalRequestView[]> {
    return this.httpClient
      .get<RentalRequestView[]>('/rental-request')
      .pipe(map((response: HttpResponse<RentalRequestView[]>) => response.data));
  }

  listReceived(): Observable<RentalRequestView[]> {
    return this.httpClient
      .get<RentalRequestView[]>('/rental-request/received')
      .pipe(map((response: HttpResponse<RentalRequestView[]>) => response.data));
  }

  confirm(requestId: string): Observable<void> {
    return this.httpClient
      .post<void>(`/rental-request/${encodeURIComponent(requestId)}/confirmation`)
      .pipe(map(() => undefined));
  }
}
