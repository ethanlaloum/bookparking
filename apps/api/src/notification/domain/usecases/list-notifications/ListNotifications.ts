import { Either } from 'effect/index';

import { UnknownError } from '../../../../shared/error/errors/UnknownError';
import { UseCase } from '../../../../shared/use-case/UseCase';
import { NotificationView } from '../../entities/NotificationView';
import { NotificationInbox } from '../../ports/NotificationInbox';

// Assez pour une cloche : les plus anciennes restent en base, et le compteur
// des non lues, lui, les compte toutes.
export const LATEST_NOTIFICATIONS_SHOWN = 30;

interface Props {
  recipientId: string;
}

export interface NotificationList {
  items: NotificationView[];
  unreadCount: number;
}

export class ListNotifications implements UseCase<
  Props,
  Promise<Either.Either<NotificationList, UnknownError>>
> {
  constructor(private readonly notificationInbox: NotificationInbox) {}

  public async execute(
    props: Props,
  ): Promise<Either.Either<NotificationList, UnknownError>> {
    try {
      const [items, unreadCount] = await Promise.all([
        this.notificationInbox.findLatestFor(
          props.recipientId,
          LATEST_NOTIFICATIONS_SHOWN,
        ),
        this.notificationInbox.countUnreadFor(props.recipientId),
      ]);
      return Either.right({ items, unreadCount });
    } catch (error: unknown) {
      return Either.left(
        new UnknownError(
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
  }
}
