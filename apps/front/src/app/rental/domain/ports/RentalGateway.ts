import type { Observable } from 'rxjs';

import type { components } from '../../../../api/schema';
import type { RentalRequestView } from '../entities/RentalRequestView';

export type RequestRentalPayload = components['schemas']['RequestRentalRequest'];
export type RequestedRental = components['schemas']['RequestRentalResponse'];
export type CancellationOutcome = components['schemas']['CancellationResult']['outcome'];

export interface RentalGateway {
  request(payload: RequestRentalPayload, idempotencyKey: string): Observable<RequestedRental>;
  abandon(requestId: string): Observable<void>;
  cancel(requestId: string): Observable<CancellationOutcome>;
  confirm(requestId: string): Observable<void>;
  listMine(): Observable<RentalRequestView[]>;
  listReceived(): Observable<RentalRequestView[]>;
}
