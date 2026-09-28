import type { Observable } from 'rxjs';

import type { NotificationList } from '../entities/Notification';

export interface NotificationGateway {
  list(): Observable<NotificationList>;
  markAllRead(): Observable<void>;
  markRead(notificationId: string): Observable<void>;
  // Le push n'existe que dans l'app : le site n'appelle jamais ces deux-là.
  registerPushDevice(token: string): Observable<void>;
  forgetPushDevice(token: string): Observable<void>;
}
