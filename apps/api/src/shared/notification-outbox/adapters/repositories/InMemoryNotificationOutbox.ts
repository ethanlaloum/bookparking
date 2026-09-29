import { Notification } from '../../domain/entities/Notification';
import { NotificationOutbox } from '../../domain/ports/NotificationOutbox';

// Tient la même promesse que l'index unique : une seule notification par
// demande, par type et par destinataire.
export class InMemoryNotificationOutbox implements NotificationOutbox {
  public notifications: Notification[] = [];
  private failing = false;

  public enableFailureOnEveryWrite(): void {
    this.failing = true;
  }

  public async notify(notification: Notification): Promise<void> {
    if (this.failing) throw new Error('notification outbox is unreachable');
    const alreadyThere = this.notifications.some(
      (existing) =>
        existing.rentalRequestId === notification.rentalRequestId &&
        existing.kind === notification.kind &&
        existing.recipientId === notification.recipientId,
    );
    if (!alreadyThere) this.notifications.push(notification);
  }

  public sent(): { kind: string; recipientId: string; requestId: string }[] {
    return this.notifications.map((notification) => ({
      kind: notification.kind,
      recipientId: notification.recipientId,
      requestId: notification.rentalRequestId,
    }));
  }
}
