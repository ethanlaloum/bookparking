import { createAction } from '@reduxjs/toolkit';
import { catchError, exhaustMap, filter, map, of } from 'rxjs';

import type { AppEpic } from '../../../../../store/AppEpic';

export const markNotificationsReadRequested = createAction(
  'notification/markNotificationsReadRequested',
);
export const markNotificationsReadSucceeded = createAction(
  'notification/markNotificationsReadSucceeded',
);
export const markNotificationsReadFailed = createAction<{ errorCode: string }>(
  'notification/markNotificationsReadFailed',
);

// Ouvrir la cloche lit tout ce qu'elle montre. Idempotent côté api : une
// seconde ouverture ne trouve plus rien de non lu.
export const markNotificationsReadEpic: AppEpic = (action$, _state$, { notificationGateway }) =>
  action$.pipe(
    filter(markNotificationsReadRequested.match),
    exhaustMap(() =>
      notificationGateway.markAllRead().pipe(
        map(() => markNotificationsReadSucceeded()),
        catchError((error: Error) =>
          of(markNotificationsReadFailed({ errorCode: error.message })),
        ),
      ),
    ),
  );
