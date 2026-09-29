import type { Observable } from 'rxjs';

import type { components } from '../../../../api/schema';
import type { RentalRequestView } from '../entities/RentalRequestView';

export type RequestRentalPayload = components['schemas']['RequestRentalRequest'];
export type RequestedRental = components['schemas']['RequestRentalResponse'];
export type CancellationOutcome = components['schemas']['CancellationResult']['outcome'];

export type IssueReason = 'NO_ACCESS' | 'PLACE_OCCUPIED' | 'OTHER';

export interface IssueReport {
  reason: IssueReason;
  message: string | null;
}

export interface RentalGateway {
  request(payload: RequestRentalPayload, idempotencyKey: string): Observable<RequestedRental>;
  abandon(requestId: string): Observable<void>;
  cancel(requestId: string): Observable<CancellationOutcome>;
  confirm(requestId: string): Observable<void>;
  confirmArrival(requestId: string): Observable<void>;
  reportIssue(requestId: string, report: IssueReport): Observable<void>;
  answerIssue(requestId: string, reply: string): Observable<void>;
  listMine(): Observable<RentalRequestView[]>;
  listReceived(): Observable<RentalRequestView[]>;
}
