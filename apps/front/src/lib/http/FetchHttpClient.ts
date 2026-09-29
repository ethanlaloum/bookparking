import { Observable } from 'rxjs';

import { HttpError, type HttpClient, type HttpResponse } from './HttpClient';

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';

const FALLBACK_BY_STATUS: Record<number, string> = {
  401: 'Votre session a expiré. Reconnectez-vous pour continuer.',
  403: "Vous n'avez pas les droits nécessaires pour cette action.",
  404: 'Cet élément est introuvable.',
  502: "Un service externe n'a pas répondu. Réessayez dans un instant.",
};

const NO_CONTENT = 204;

export class FetchHttpClient implements HttpClient {
  constructor(
    private readonly baseUrl: string,
    private readonly readToken: () => string | null,
  ) {}

  get<T>(path: string): Observable<HttpResponse<T>> {
    return this.request<T>('GET', path);
  }

  post<T>(path: string, body?: unknown): Observable<HttpResponse<T>> {
    return this.request<T>('POST', path, body);
  }

  patch<T>(path: string, body?: unknown): Observable<HttpResponse<T>> {
    return this.request<T>('PATCH', path, body);
  }

  delete<T>(path: string): Observable<HttpResponse<T>> {
    return this.request<T>('DELETE', path);
  }

  private request<T>(method: Method, path: string, body?: unknown): Observable<HttpResponse<T>> {
    return new Observable<HttpResponse<T>>((subscriber) => {
      const controller = new AbortController();

      const headers: Record<string, string> = {};
      if (body !== undefined) headers['Content-Type'] = 'application/json';
      const token = this.readToken();
      if (token !== null) headers.Authorization = `Bearer ${token}`;

      fetch(`${this.baseUrl}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok) throw await readError(response);
          const data = response.status === NO_CONTENT ? undefined : await readJson(response);
          subscriber.next({ data: data as T, status: response.status });
          subscriber.complete();
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) return;
          subscriber.error(normalize(error));
        });

      return () => controller.abort();
    });
  }
}

const readJson = async (response: Response): Promise<unknown> => {
  const text = await response.text();
  if (text === '') return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
};

const readError = async (response: Response): Promise<HttpError> => {
  const body = (await readJson(response)) as { message?: unknown } | undefined;
  const message =
    typeof body?.message === 'string' && body.message.trim() !== ''
      ? body.message
      : (FALLBACK_BY_STATUS[response.status] ??
        'Une erreur inattendue est survenue. Réessayez dans un instant.');
  return new HttpError(response.status, message);
};

const normalize = (error: unknown): HttpError => {
  if (error instanceof HttpError) return error;
  return new HttpError(0, "Le serveur est injoignable. Vérifiez votre connexion.");
};
