import { createAction } from '@reduxjs/toolkit';
import { catchError, EMPTY, exhaustMap, filter, map, mergeMap, of } from 'rxjs';

import type { AppEpic } from '../../../../../store/AppEpic';
import { logoutRequested } from '../../../../auth/domain/use-cases/sign-out/signOutEpic';

export const forgetPushDeviceRequested = createAction<{ token: string }>(
  'notification/forgetPushDeviceRequested',
);
export const forgetPushDeviceSucceeded = createAction('notification/forgetPushDeviceSucceeded');
export const forgetPushDeviceFailed = createAction<{ errorCode: string }>(
  'notification/forgetPushDeviceFailed',
);

/**
 * Se déconnecter, c'est aussi cesser de recevoir les push du compte sur ce
 * téléphone : sans quoi le suivant à s'en servir lirait sur l'écran verrouillé
 * les demandes de l'autre. `signOutEpic` passe avant celui-ci et vide l'état
 * aussitôt : le jeton survit donc à `logoutSucceeded` (`NotificationSlice`) et
 * ne s'efface qu'ici. La route d'oubli n'exige pas de session, et un échec ne
 * retient pas la déconnexion.
 */
export const forgetPushDeviceOnSignOutEpic: AppEpic = (action$, state$) =>
  action$.pipe(
    filter(logoutRequested.match),
    mergeMap(() => {
      const token = state$.value.core.notification.pushToken;
      return token === null ? EMPTY : of(forgetPushDeviceRequested({ token }));
    }),
  );

export const forgetPushDeviceEpic: AppEpic = (action$, _state$, { notificationGateway }) =>
  action$.pipe(
    filter(forgetPushDeviceRequested.match),
    exhaustMap((action) =>
      notificationGateway.forgetPushDevice(action.payload.token).pipe(
        map(() => forgetPushDeviceSucceeded()),
        catchError((error: Error) => of(forgetPushDeviceFailed({ errorCode: error.message }))),
      ),
    ),
  );
