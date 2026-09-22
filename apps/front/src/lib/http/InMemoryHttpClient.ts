import { Observable, of, throwError } from 'rxjs';

import { HttpError, type HttpClient, type HttpResponse } from './HttpClient';

export interface RecordedCall {
  method: string;
  path: string;
  body?: unknown;
}

export class InMemoryHttpClient implements HttpClient {
  public readonly calls: RecordedCall[] = [];

  private readonly responses = new Map<string, unknown>();
  private readonly failures = new Map<string, HttpError>();

  feed(method: string, path: string, data: unknown): void {
    this.responses.set(key(method, path), data);
  }

  fail(method: string, path: string, status: number, message: string): void {
    this.failures.set(key(method, path), new HttpError(status, message));
  }

  get<T>(path: string): Observable<HttpResponse<T>> {
    return this.answer<T>('GET', path);
  }

  post<T>(path: string, body?: unknown): Observable<HttpResponse<T>> {
    return this.answer<T>('POST', path, body);
  }

  patch<T>(path: string, body?: unknown): Observable<HttpResponse<T>> {
    return this.answer<T>('PATCH', path, body);
  }

  delete<T>(path: string, body?: unknown): Observable<HttpResponse<T>> {
    return this.answer<T>('DELETE', path, body);
  }

  private answer<T>(method: string, path: string, body?: unknown): Observable<HttpResponse<T>> {
    this.calls.push(body === undefined ? { method, path } : { method, path, body });
    const failure = this.failures.get(key(method, path));
    if (failure !== undefined) return throwError(() => failure);
    const data = this.responses.get(key(method, path));
    return of({ data: data as T, status: data === undefined ? 204 : 200 });
  }
}

const key = (method: string, path: string): string => `${method} ${path}`;
