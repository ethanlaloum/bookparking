import { createAction } from '@reduxjs/toolkit';
import { catchError, exhaustMap, filter, map, of } from 'rxjs';

import type { AppEpic } from '../../../../../store/AppEpic';
import type { NotificationList } from '../../entities/Notification';

export const listNotificationsRequested = createAction('notification/listNotificationsRequested');
export const listNotificationsSucceeded = createAction<NotificationList>(
  'notification/listNotificationsSucceeded',
);
export const listNotificationsFailed = createAction<{ errorCode: string }>(
  'notification/listNotificationsFailed',
);

/**
 * La cloche se relit à intervalle régulier tant qu'une session est ouverte :
 * c'est l'écran qui cadence, l'epic ne fait qu'une lecture. `exhaustMap` : une
 * relecture qui tombe pendant la précédente ne part pas.
 */
export const listNotificationsEpic: AppEpic = (action$, _state$, { notificationGateway }) =>
  action$.pipe(
    filter(listNotificationsRequested.match),
    exhaustMap(() =>
      notificationGateway.list().pipe(
        map((list) => listNotificationsSucceeded(list)),
        catchError((error: Error) => of(listNotificationsFailed({ errorCode: error.message }))),
      ),
    ),
  );
