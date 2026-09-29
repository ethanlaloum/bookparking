import { createReducer } from '@reduxjs/toolkit';

import { logoutSucceeded } from '../../auth/domain/use-cases/sign-out/signOutEpic';
import { initialCommonState, type CommonState } from '../../../store/CommonState';
import type { Notification } from '../domain/entities/Notification';
import {
  listNotificationsFailed,
  listNotificationsRequested,
  listNotificationsSucceeded,
} from '../domain/use-cases/list-notifications/listNotificationsEpic';
import {
  markNotificationsReadFailed,
  markNotificationsReadRequested,
  markNotificationsReadSucceeded,
} from '../domain/use-cases/mark-notifications-read/markNotificationsReadEpic';
import { forgetPushDeviceRequested } from '../domain/use-cases/forget-push-device/forgetPushDeviceEpic';
import {
  markNotificationReadRequested,
  markNotificationReadSucceeded,
} from '../domain/use-cases/mark-notification-read/markNotificationReadEpic';
import { registerPushDeviceRequested } from '../domain/use-cases/register-push-device/registerPushDeviceEpic';

export interface NotificationState {
  items: Notification[];
  unreadCount: number;
  list: CommonState;
  markRead: CommonState;
  // Le jeton de push confié à l'api pour cette session : c'est lui qu'on
  // oublie en se déconnectant. Toujours `null` sur le site.
  pushToken: string | null;
  // Les notifications que l'écran a déjà montrées pour elles-mêmes — fêtées,
  // ou lues d'un coup en ouvrant la cloche — avant que la relecture suivante
  // ne rapporte leur `readAt`. Elles ne se fêtent plus.
  acknowledged: string[];
}

const initialState: NotificationState = {
  items: [],
  unreadCount: 0,
  list: initialCommonState,
  markRead: initialCommonState,
  pushToken: null,
  acknowledged: [],
};

export const notificationReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(listNotificationsRequested, (state) => {
      state.list = { state: 'pending' };
    })
    .addCase(listNotificationsSucceeded, (state, action) => {
      state.list = { state: 'succeeded' };
      state.items = action.payload.items;
      state.unreadCount = action.payload.unreadCount;
    })
    // Une relecture ratée garde ce qui était affiché : la cloche ne se vide
    // pas parce qu'une requête sur dix s'est perdue.
    .addCase(listNotificationsFailed, (state, action) => {
      state.list = { state: 'failed', errorCode: action.payload.errorCode };
    })
    .addCase(markNotificationsReadRequested, (state) => {
      state.markRead = { state: 'pending' };
    })
    // Seul le compteur tombe : les notifications gardent leur `readAt` jusqu'à
    // la prochaine lecture, pour que la cloche ouverte montre encore ce qui
    // était nouveau.
    .addCase(markNotificationsReadSucceeded, (state) => {
      state.markRead = { state: 'succeeded' };
      state.unreadCount = 0;
      for (const item of state.items)
        if (item.readAt === null && !state.acknowledged.includes(item.id))
          state.acknowledged.push(item.id);
    })
    .addCase(markNotificationReadRequested, (state, action) => {
      if (!state.acknowledged.includes(action.payload.notificationId))
        state.acknowledged.push(action.payload.notificationId);
    })
    .addCase(markNotificationReadSucceeded, (state, action) => {
      const item = state.items.find((candidate) => candidate.id === action.payload.notificationId);
      if (item === undefined || item.readAt !== null) return;
      item.readAt = action.payload.readAt;
      state.unreadCount = Math.max(0, state.unreadCount - 1);
    })
    .addCase(markNotificationsReadFailed, (state, action) => {
      state.markRead = { state: 'failed', errorCode: action.payload.errorCode };
    })
    .addCase(registerPushDeviceRequested, (state, action) => {
      state.pushToken = action.payload.token;
    })
    .addCase(forgetPushDeviceRequested, (state) => {
      state.pushToken = null;
    })
    // Le jeton survit à la déconnexion le temps que `forgetPushDeviceOnSignOutEpic`
    // le lise : `signOutEpic` rend `logoutSucceeded` avant qu'il ne voie passer
    // `logoutRequested`.
    .addCase(logoutSucceeded, (state) => ({ ...initialState, pushToken: state.pushToken }));
});
