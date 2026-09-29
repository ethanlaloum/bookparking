import { createAction } from '@reduxjs/toolkit';
import { catchError, exhaustMap, filter, map, of } from 'rxjs';

import type { AppEpic } from '../../../../../store/AppEpic';

export const registerPushDeviceRequested = createAction<{ token: string }>(
  'notification/registerPushDeviceRequested',
);
export const registerPushDeviceSucceeded = createAction('notification/registerPushDeviceSucceeded');
export const registerPushDeviceFailed = createAction<{ errorCode: string }>(
  'notification/registerPushDeviceFailed',
);

/**
 * L'app obtient son jeton de push (adaptateur natif, `apps/mobile`) et le
 * confie ici à chaque session ouverte. L'api rattache le téléphone au compte :
 * idempotent par l'état, un second envoi ne change rien.
 */
export const registerPushDeviceEpic: AppEpic = (action$, _state$, { notificationGateway }) =>
  action$.pipe(
    filter(registerPushDeviceRequested.match),
    exhaustMap((action) =>
      notificationGateway.registerPushDevice(action.payload.token).pipe(
        map(() => registerPushDeviceSucceeded()),
        catchError((error: Error) => of(registerPushDeviceFailed({ errorCode: error.message }))),
      ),
    ),
  );
