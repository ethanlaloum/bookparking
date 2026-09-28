import { NotificationView } from '../../../domain/entities/NotificationView';
import { NotificationInbox } from '../../../domain/ports/NotificationInbox';

export class InMemoryNotificationInbox implements NotificationInbox {
  public views: (NotificationView & { recipientId: string })[] = [];
  private failing = false;

  public enableFailureOnEveryRead(): void {
    this.failing = true;
  }

  public async findLatestFor(
    recipientId: string,
    limit: number,
  ): Promise<NotificationView[]> {
    if (this.failing) throw new Error('notification inbox is unreachable');
    return this.views
      .filter((view) => view.recipientId === recipientId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit)
      .map(({ recipientId: _recipientId, ...view }) => view);
  }

  public async countUnreadFor(recipientId: string): Promise<number> {
    if (this.failing) throw new Error('notification inbox is unreachable');
    return this.views.filter(
      (view) => view.recipientId === recipientId && view.readAt === null,
    ).length;
  }

  public async markReadFor(
    recipientId: string,
    notificationId: string,
    readAt: Date,
  ): Promise<void> {
    if (this.failing) throw new Error('notification inbox is unreachable');
    this.views = this.views.map((view) =>
      view.recipientId === recipientId &&
      view.id === notificationId &&
      view.readAt === null
        ? { ...view, readAt }
        : view,
    );
  }

  public async markAllReadFor(
    recipientId: string,
    readAt: Date,
  ): Promise<void> {
    if (this.failing) throw new Error('notification inbox is unreachable');
    this.views = this.views.map((view) =>
      view.recipientId === recipientId && view.readAt === null
        ? { ...view, readAt }
        : view,
    );
  }
}
