import { catchError, map, throwError, type Observable } from 'rxjs';

import { isHttpError, type HttpClient, type HttpResponse } from '../../../lib/http/HttpClient';
import type { AdminAccount } from '../domain/entities/AdminAccount';
import type { AdminListing } from '../domain/entities/AdminListing';
import type { AdminRentalRequest } from '../domain/entities/AdminRentalRequest';
import type { Overview } from '../domain/entities/Overview';
import {
  BackOfficeError,
  type BackOfficeGateway,
  type FailureKind,
} from '../domain/ports/BackOfficeGateway';

const KIND_BY_STATUS: Record<number, FailureKind> = {
  400: 'refused',
  401: 'session-expired',
  403: 'forbidden',
  404: 'not-found',
};

const asBackOfficeError = (error: unknown): BackOfficeError => {
  if (error instanceof BackOfficeError) return error;
  if (isHttpError(error))
    return new BackOfficeError(KIND_BY_STATUS[error.status] ?? 'other', error.message);
  return new BackOfficeError(
    'other',
    error instanceof Error ? error.message : String(error),
  );
};

const id = (value: string): string => encodeURIComponent(value);

export class BookparkingRxBackOfficeGateway implements BackOfficeGateway {
  constructor(private readonly httpClient: HttpClient) {}

  confirmAccess(): Observable<void> {
    return this.act(this.httpClient.get<void>('/admin/access'));
  }

  readOverview(): Observable<Overview> {
    return this.read<Overview>('/admin/overview');
  }

  listAccounts(): Observable<AdminAccount[]> {
    return this.read<AdminAccount[]>('/admin/accounts');
  }

  listListings(): Observable<AdminListing[]> {
    return this.read<AdminListing[]>('/admin/listings');
  }

  listRentalRequests(): Observable<AdminRentalRequest[]> {
    return this.read<AdminRentalRequest[]>('/admin/rental-requests');
  }

  unpublishListing(listingId: string, reason: string): Observable<void> {
    return this.act(this.httpClient.post<void>(`/admin/listings/${id(listingId)}/unpublish`, { reason }));
  }

  suspendAccount(accountId: string, reason: string): Observable<void> {
    return this.act(this.httpClient.post<void>(`/admin/accounts/${id(accountId)}/suspension`, { reason }));
  }

  /**
   * Un `DELETE` **avec** un corps : lever une suspension est une action de
   * modération comme les trois autres, et l'api lui demande le même motif.
   */
  liftAccountSuspension(accountId: string, reason: string): Observable<void> {
    return this.act(
      this.httpClient.delete<void>(`/admin/accounts/${id(accountId)}/suspension`, { reason }),
    );
  }

  cancelRentalRequest(requestId: string, reason: string): Observable<void> {
    return this.act(
      this.httpClient.post<void>(`/admin/rental-requests/${id(requestId)}/cancellation`, { reason }),
    );
  }

  private read<T>(path: string): Observable<T> {
    return this.httpClient.get<T>(path).pipe(
      map((response: HttpResponse<T>) => response.data),
      catchError((error: unknown) => throwError(() => asBackOfficeError(error))),
    );
  }

  private act(call: Observable<HttpResponse<void>>): Observable<void> {
    return call.pipe(
      map(() => undefined),
      catchError((error: unknown) => throwError(() => asBackOfficeError(error))),
    );
  }
}
