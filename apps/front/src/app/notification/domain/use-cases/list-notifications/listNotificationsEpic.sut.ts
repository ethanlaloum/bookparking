import { logoutRequested } from '../../../../auth/domain/use-cases/sign-out/signOutEpic';
import {
  selectNotifications,
  selectNotificationsError,
  selectNotificationsFirstLoading,
  selectUnreadNotificationCount,
} from '../../../../../selectors/notification/notificationSelectors';
import {
  aNotification,
  buildInMemoryDependencies,
  type InMemoryDependencies,
} from '../../../../../store/testing/InMemoryDependencies';
import { createTestStore } from '../../../../../store/testing/createTestStore';
import type { Notification } from '../../entities/Notification';
import { markNotificationsReadRequested } from '../mark-notifications-read/markNotificationsReadEpic';
import { listNotificationsRequested } from './listNotificationsEpic';

export const createNotificationsSut = () => {
  const dependencies: InMemoryDependencies = buildInMemoryDependencies();
  const store = createTestStore(dependencies);

  return {
    aNotification,

    givenTheApiHolds(items: Notification[], unreadCount: number): void {
      dependencies.notificationGateway.held = { items, unreadCount };
    },
    givenTheListFailsWith(message: string): void {
      dependencies.notificationGateway.rejection = message;
    },
    givenMarkingReadFailsWith(message: string): void {
      dependencies.notificationGateway.markReadRejection = message;
    },
    whenTheBellIsRead(): void {
      store.dispatch(listNotificationsRequested());
    },
    whenTheBellIsOpened(): void {
      store.dispatch(markNotificationsReadRequested());
    },
    whenSigningOut(): void {
      store.dispatch(logoutRequested());
    },
    thenTheNotificationsShownAre(ids: string[]): void {
      const actual = selectNotifications(store.getState()).map((item) => item.id);
      if (JSON.stringify(actual) !== JSON.stringify(ids))
        throw new Error(`Notifications attendues ${ids.join(',')}, obtenues ${actual.join(',')}`);
    },
    thenTheUnreadNotificationsShownAre(ids: string[]): void {
      const actual = selectNotifications(store.getState())
        .filter((item) => item.readAt === null)
        .map((item) => item.id);
      if (JSON.stringify(actual) !== JSON.stringify(ids))
        throw new Error(`Non lues attendues ${ids.join(',')}, obtenues ${actual.join(',')}`);
    },
    thenTheBadgeShows(expected: number): void {
      const actual = selectUnreadNotificationCount(store.getState());
      if (actual !== expected) throw new Error(`Pastille attendue ${expected}, obtenue ${actual}`);
    },
    thenTheErrorShownIs(expected: string | null): void {
      const actual = selectNotificationsError(store.getState());
      if (actual !== expected)
        throw new Error(`Erreur attendue "${String(expected)}", obtenue "${String(actual)}"`);
    },
    thenTheBellIsNotLoading(): void {
      if (selectNotificationsFirstLoading(store.getState()))
        throw new Error('La cloche ne devrait pas être en chargement');
    },
    thenTheApiWasAskedToMarkRead(times: number): void {
      const actual = dependencies.notificationGateway.markAllReadCallCount;
      if (actual !== times) throw new Error(`Lectures attendues ${times}, obtenues ${actual}`);
    },
  };
};
