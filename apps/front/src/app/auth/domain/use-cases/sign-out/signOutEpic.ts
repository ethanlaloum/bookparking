import { createAction } from '@reduxjs/toolkit';
import { filter, map, tap } from 'rxjs';

import type { AppEpic } from '../../../../../store/AppEpic';

export const logoutRequested = createAction('auth/logoutRequested');
export const logoutSucceeded = createAction('auth/logoutSucceeded');

export const signOutEpic: AppEpic = (action$, _state$, { sessionStore }) =>
  action$.pipe(
    filter(logoutRequested.match),
    tap(() => sessionStore.clear()),
    map(() => logoutSucceeded()),
  );
