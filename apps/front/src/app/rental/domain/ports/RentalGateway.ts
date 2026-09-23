import type { Observable } from 'rxjs';

import type { components } from '../../../../api/schema';
import type { RentalRequestView } from '../entities/RentalRequestView';

export type RequestRentalPayload = components['schemas']['RequestRentalRequest'];
export type RequestedRental = components['schemas']['RequestRentalResponse'];

export interface RentalGateway {
  request(payload: RequestRentalPayload): Observable<RequestedRental>;
  abandon(requestId: string): Observable<void>;
  confirm(requestId: string): Observable<void>;
  listMine(): Observable<RentalRequestView[]>;
  listReceived(): Observable<RentalRequestView[]>;
}
