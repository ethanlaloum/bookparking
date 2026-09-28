import {
  selectBookingToCelebrate,
  selectUnreadNotificationCount,
} from '../../../../../selectors/notification/notificationSelectors';
import {
  aNotification,
  buildInMemoryDependencies,
  type InMemoryDependencies,
} from '../../../../../store/testing/InMemoryDependencies';
import { createTestStore } from '../../../../../store/testing/createTestStore';
import type { Notification } from '../../entities/Notification';
import { listNotificationsRequested } from '../list-notifications/listNotificationsEpic';
import { markNotificationsReadRequested } from '../mark-notifications-read/markNotificationsReadEpic';
import { markNotificationReadRequested } from './markNotificationReadEpic';

export const createCelebrationSut = () => {
  const dependencies: InMemoryDependencies = buildInMemoryDependencies();
  const store = createTestStore(dependencies);

  return {
    accepted: (overrides: Partial<Notification>) =>
      aNotification({ kind: 'RENTAL_REQUEST_ACCEPTED', audience: 'RENTER', ...overrides }),
    aNotification,

    givenTheBellHolds(items: Notification[]): void {
      dependencies.notificationGateway.held = {
        items,
        unreadCount: items.filter((item) => item.readAt === null).length,
      };
      store.dispatch(listNotificationsRequested());
    },
    whenTheCelebrationIsDismissed(notificationId: string): void {
      store.dispatch(markNotificationReadRequested({ notificationId }));
    },
    whenTheBellIsOpened(): void {
      store.dispatch(markNotificationsReadRequested());
    },
    thenTheBookingCelebratedIs(expected: string | null): void {
      const actual = selectBookingToCelebrate(store.getState())?.id ?? null;
      if (actual !== expected)
        throw new Error(`Fête attendue ${String(expected)}, obtenue ${String(actual)}`);
    },
    thenTheApiMarkedRead(ids: string[]): void {
      const actual = dependencies.notificationGateway.markedRead;
      if (JSON.stringify(actual) !== JSON.stringify(ids))
        throw new Error(`Lues attendues ${ids.join(',')}, obtenues ${actual.join(',')}`);
    },
    thenTheBadgeShows(expected: number): void {
      const actual = selectUnreadNotificationCount(store.getState());
      if (actual !== expected) throw new Error(`Pastille attendue ${expected}, obtenue ${actual}`);
    },
  };
};
