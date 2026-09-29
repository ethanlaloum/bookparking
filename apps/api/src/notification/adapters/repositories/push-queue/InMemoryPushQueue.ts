import { NotificationKind } from '../../../../shared/notification-outbox/domain/entities/Notification';
import { NotificationAudience } from '../../../domain/entities/NotificationView';
import { PendingPush, PushQueue } from '../../../domain/ports/PushQueue';
import { InMemoryPushDeviceRepository } from '../push-device/InMemoryPushDeviceRepository';

interface QueuedNotification {
  notificationId: string;
  kind: NotificationKind;
  audience: NotificationAudience;
  recipientId: string;
  createdAt: Date;
  pushedAt: Date | null;
}

// Les téléphones sont lus au moment de la lecture, comme la jointure du vrai
// dépôt : un jeton oublié entre deux balayages n'est plus visé.
export class InMemoryPushQueue implements PushQueue {
  public notifications: QueuedNotification[] = [];

  constructor(private readonly devices: InMemoryPushDeviceRepository) {}

  public async findUnpushed(limit: number): Promise<PendingPush[]> {
    return this.notifications
      .filter((notification) => notification.pushedAt === null)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .slice(0, limit)
      .map((notification) => ({
        notificationId: notification.notificationId,
        kind: notification.kind,
        audience: notification.audience,
        createdAt: notification.createdAt,
        tokens: this.devices.tokensOf(notification.recipientId),
      }));
  }

  public async markPushed(
    notificationIds: string[],
    pushedAt: Date,
  ): Promise<void> {
    for (const notification of this.notifications)
      if (
        notificationIds.includes(notification.notificationId) &&
        notification.pushedAt === null
      )
        notification.pushedAt = pushedAt;
  }
}
