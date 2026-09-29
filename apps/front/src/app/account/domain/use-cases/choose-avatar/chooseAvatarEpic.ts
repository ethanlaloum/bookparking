import { createAction } from '@reduxjs/toolkit';
import { catchError, exhaustMap, filter, map, of } from 'rxjs';

import type { AppEpic } from '../../../../../store/AppEpic';
import type { Avatar } from '../../entities/Avatar';

export const chooseAvatarRequested = createAction<Avatar>('account/chooseAvatarRequested');
export const chooseAvatarSucceeded = createAction<Avatar>('account/chooseAvatarSucceeded');
export const chooseAvatarFailed = createAction<{ errorCode: string }>('account/chooseAvatarFailed');
export const resetChooseAvatarState = createAction('account/resetChooseAvatarState');

/**
 * `PATCH /account/avatar` répond 204 sans corps. Le slice affiche le pilote
 * choisi dès la demande, et rend le précédent si l'api refuse.
 */
export const chooseAvatarEpic: AppEpic = (action$, _state$, { accountGateway }) =>
  action$.pipe(
    filter(chooseAvatarRequested.match),
    exhaustMap((action) =>
      accountGateway.chooseAvatar(action.payload).pipe(
        map(() => chooseAvatarSucceeded(action.payload)),
        catchError((error: Error) => of(chooseAvatarFailed({ errorCode: error.message }))),
      ),
    ),
  );
