import { createSelector } from '@reduxjs/toolkit';

import {
  bookingToCelebrate,
  type Notification,
} from '../../app/notification/domain/entities/Notification';
import type { AppState } from '../../store/AppState';

export const selectNotifications = (state: AppState): Notification[] =>
  state.core.notification.items;

export const selectUnreadNotificationCount = (state: AppState): number =>
  state.core.notification.unreadCount;

// Vrai seulement avant la toute première réponse : une relecture périodique
// ne fait pas clignoter la cloche.
export const selectNotificationsFirstLoading = (state: AppState): boolean =>
  state.core.notification.list.state === 'pending' && state.core.notification.items.length === 0;

export const selectNotificationsError = (state: AppState): string | null =>
  state.core.notification.list.state === 'failed'
    ? (state.core.notification.list.errorCode ?? null)
    : null;

// La réservation confirmée à fêter à l'écran, s'il y en a une : la plus
// ancienne que ni la cloche ni une fête n'ont encore montrée.
export const selectBookingToCelebrate = createSelector(
  [
    (state: AppState) => state.core.notification.items,
    (state: AppState) => state.core.notification.acknowledged,
  ],
  (items, acknowledged): Notification | null => bookingToCelebrate(items, acknowledged),
);
