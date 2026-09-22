import type { Observable } from 'rxjs';

export interface HttpResponse<T> {
  data: T;
  status: number;
}

export class HttpError extends Error {
  public readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

export const isHttpError = (error: unknown): error is HttpError => error instanceof HttpError;

/**
 * `delete` porte un corps, ce qui n'est pas l'usage le plus courant du verbe :
 * `DELETE /admin/accounts/:id/suspension` exige un motif comme les trois
 * autres actions de modération, et un `delete` sans corps rendrait 400 sur la
 * seule action qui lève une sanction.
 */
export interface HttpClient {
  get<T>(path: string): Observable<HttpResponse<T>>;
  post<T>(path: string, body?: unknown): Observable<HttpResponse<T>>;
  patch<T>(path: string, body?: unknown): Observable<HttpResponse<T>>;
  delete<T>(path: string, body?: unknown): Observable<HttpResponse<T>>;
}
