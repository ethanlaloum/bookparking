import { createAction } from '@reduxjs/toolkit';
import { catchError, exhaustMap, filter, map, of, tap } from 'rxjs';

import type { AppEpic } from '../../../../../store/AppEpic';
import type { Session } from '../../entities/Session';
import type { Credentials } from '../../ports/SessionGateway';

export const signInRequested = createAction<Credentials>('auth/signInRequested');
export const signInSucceeded = createAction<Session>('auth/signInSucceeded');
export const signInFailed = createAction<{ errorCode: string }>('auth/signInFailed');
export const resetSignInState = createAction('auth/resetSignInState');

export const signInEpic: AppEpic = (action$, _state$, { sessionGateway, sessionStore }) =>
  action$.pipe(
    filter(signInRequested.match),
    exhaustMap((action) =>
      sessionGateway.signIn(action.payload).pipe(
        tap((session) => sessionStore.save(session)),
        map((session) => signInSucceeded(session)),
        catchError((error: Error) => of(signInFailed({ errorCode: error.message }))),
      ),
    ),
  );
