import { NotificationKind } from '../../../shared/notification-outbox/domain/entities/Notification';
import { NotificationAudience } from '../entities/NotificationView';

// Une notification pas encore poussée, et les téléphones de son destinataire
// au moment de la lecture — aucun s'il n'en a pas.
export interface PendingPush {
  notificationId: string;
  kind: NotificationKind;
  audience: NotificationAudience;
  createdAt: Date;
  tokens: string[];
}

export interface PushQueue {
  findUnpushed(limit: number): Promise<PendingPush[]>;
  markPushed(notificationIds: string[], pushedAt: Date): Promise<void>;
}
