import { createAction } from '@reduxjs/toolkit';
import { catchError, filter, map, mergeMap, of } from 'rxjs';

import type { AppEpic } from '../../../../../store/AppEpic';

export const markNotificationReadRequested = createAction<{ notificationId: string }>(
  'notification/markNotificationReadRequested',
);
export const markNotificationReadSucceeded = createAction<{
  notificationId: string;
  readAt: string;
}>('notification/markNotificationReadSucceeded');
export const markNotificationReadFailed = createAction<{ errorCode: string }>(
  'notification/markNotificationReadFailed',
);

// Une réservation fêtée à l'écran est une notification lue : on ne la fête
// qu'une fois, sur le premier écran qui la montre. `mergeMap` : deux
// notifications marquées coup sur coup partent toutes les deux.
export const markNotificationReadEpic: AppEpic = (action$, _state$, { notificationGateway, clock }) =>
  action$.pipe(
    filter(markNotificationReadRequested.match),
    mergeMap(({ payload }) =>
      notificationGateway.markRead(payload.notificationId).pipe(
        map(() =>
          markNotificationReadSucceeded({
            notificationId: payload.notificationId,
            readAt: clock.now().toISOString(),
          }),
        ),
        catchError((error: Error) => of(markNotificationReadFailed({ errorCode: error.message }))),
      ),
    ),
  );
