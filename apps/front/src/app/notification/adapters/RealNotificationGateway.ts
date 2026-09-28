import { map, type Observable } from 'rxjs';

import type { HttpClient, HttpResponse } from '../../../lib/http/HttpClient';
import type { NotificationList } from '../domain/entities/Notification';
import type { NotificationGateway } from '../domain/ports/NotificationGateway';

export class BookparkingRxNotificationGateway implements NotificationGateway {
  constructor(private readonly httpClient: HttpClient) {}

  list(): Observable<NotificationList> {
    return this.httpClient
      .get<NotificationList>('/notification')
      .pipe(map((response: HttpResponse<NotificationList>) => response.data));
  }

  markAllRead(): Observable<void> {
    return this.httpClient.post<void>('/notification/read').pipe(map(() => undefined));
  }

  markRead(notificationId: string): Observable<void> {
    return this.httpClient
      .post<void>(`/notification/${encodeURIComponent(notificationId)}/read`)
      .pipe(map(() => undefined));
  }

  registerPushDevice(token: string): Observable<void> {
    return this.httpClient
      .post<void>('/notification/push-device', { token })
      .pipe(map(() => undefined));
  }

  forgetPushDevice(token: string): Observable<void> {
    return this.httpClient
      .post<void>('/notification/push-device/removal', { token })
      .pipe(map(() => undefined));
  }
}
