import { Either } from 'effect/index';

import { InMemoryNotificationInbox } from '../../../adapters/repositories/notification-inbox/InMemoryNotificationInbox';
import { MarkNotificationRead } from '../mark-notification-read/MarkNotificationRead';
import { MarkNotificationsRead } from './MarkNotificationsRead';

export const createMarkNotificationsReadSUT = () => {
  const notificationInbox = new InMemoryNotificationInbox();
  const markNotificationsRead = new MarkNotificationsRead(notificationInbox);
  const markNotificationRead = new MarkNotificationRead(notificationInbox);
  let sequence = 0;

  return {
    givenNotification(params: { recipientId: string; readAt?: string }) {
      sequence += 1;
      notificationInbox.views.push({
        id: `notification-${sequence}`,
        kind: 'RENTAL_REQUEST_ACCEPTED',
        audience: 'RENTER',
        recipientId: params.recipientId,
        createdAt: new Date('2026-10-01T09:00:00.000Z'),
        readAt: params.readAt ? new Date(params.readAt) : null,
        requestId: `request-${sequence}`,
        address: '12 rue Barla, 06300 Nice',
        box: '12',
        fromDay: '2026-10-10',
        toDay: '2026-10-12',
      });
      return `notification-${sequence}`;
    },

    async whenMarkingReadFor(recipientId: string, at: string) {
      return markNotificationsRead.execute({
        recipientId,
        readAt: new Date(at),
      });
    },

    async whenMarkingOneReadFor(
      recipientId: string,
      notificationId: string,
      at: string,
    ) {
      return markNotificationRead.execute({
        recipientId,
        notificationId,
        readAt: new Date(at),
      });
    },

    thenResultIsRight(result: Either.Either<unknown, unknown>) {
      expect(Either.isRight(result)).toEqual(true);
    },

    thenReadAtAre(expected: Record<string, string | null>) {
      expect(
        Object.fromEntries(
          notificationInbox.views.map((view) => [
            view.id,
            view.readAt?.toISOString() ?? null,
          ]),
        ),
      ).toEqual(expected);
    },
  };
};
