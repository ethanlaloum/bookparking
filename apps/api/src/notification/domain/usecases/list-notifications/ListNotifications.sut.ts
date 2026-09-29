import { Either } from 'effect/index';

import { NotificationKind } from '../../../../shared/notification-outbox/domain/entities/Notification';
import { InMemoryNotificationInbox } from '../../../adapters/repositories/notification-inbox/InMemoryNotificationInbox';
import { NotificationList, ListNotifications } from './ListNotifications';

export const createListNotificationsSUT = () => {
  const notificationInbox = new InMemoryNotificationInbox();
  const listNotifications = new ListNotifications(notificationInbox);
  let sequence = 0;

  const aNotification = (params: {
    recipientId: string;
    createdAt: string;
    kind?: NotificationKind;
    readAt?: string;
  }) => {
    sequence += 1;
    notificationInbox.views.push({
      id: `notification-${sequence}`,
      kind: params.kind ?? 'RENTAL_REQUEST_RECEIVED',
      audience: 'OWNER',
      recipientId: params.recipientId,
      createdAt: new Date(params.createdAt),
      readAt: params.readAt ? new Date(params.readAt) : null,
      requestId: `request-${sequence}`,
      address: '12 rue Barla, 06300 Nice',
      box: '12',
      fromDay: '2026-10-10',
      toDay: '2026-10-12',
    });
    return `notification-${sequence}`;
  };

  return {
    aNotification,

    givenTheInboxIsUnreachable() {
      notificationInbox.enableFailureOnEveryRead();
    },

    async whenListingFor(recipientId: string) {
      return listNotifications.execute({ recipientId });
    },

    thenListIs(
      result: Either.Either<NotificationList, unknown>,
      expected: { ids: string[]; unreadCount: number },
    ) {
      expect(Either.isRight(result)).toEqual(true);
      if (Either.isRight(result))
        expect({
          ids: result.right.items.map((item) => item.id),
          unreadCount: result.right.unreadCount,
        }).toEqual(expected);
    },

    thenResultIsLeft(result: Either.Either<unknown, unknown>) {
      expect(Either.isLeft(result)).toEqual(true);
    },
  };
};
