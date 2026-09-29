import { createAction } from '@reduxjs/toolkit';
import { catchError, concatMap, exhaustMap, filter, map, of, tap } from 'rxjs';

import type { Session } from '@front/app/auth/domain/entities/Session';
import type { Credentials } from '@front/app/auth/domain/ports/SessionGateway';

import type { AppEpic } from '../../../../../store/AppEpic';
import { failureOf, type Failure } from '../../../../back-office/domain/ports/BackOfficeGateway';

export const signInRequested = createAction<Credentials>('auth/signInRequested');
export const signInSucceeded = createAction<Session>('auth/signInSucceeded');
export const signInFailed = createAction<Failure>('auth/signInFailed');
export const resetSignInState = createAction('auth/resetSignInState');

/**
 * `POST /session` ouvre une session à n'importe quel compte : c'est
 * `GET /admin/access` qui dit si celui-ci administre le site. La session est
 * écrite avant la sonde, parce que le client HTTP lit son jeton dans le
 * stockage, puis effacée si la sonde échoue — un conducteur ne garde rien de
 * son passage ici, et la console ne s'ouvre jamais sur un compte qu'elle
 * refuserait au premier écran.
 */
export const signInEpic: AppEpic = (
  action$,
  _state$,
  { backOfficeGateway, sessionGateway, sessionStore },
) =>
  action$.pipe(
    filter(signInRequested.match),
    exhaustMap((action) =>
      sessionGateway.signIn(action.payload).pipe(
        tap((session) => sessionStore.save(session)),
        concatMap((session) =>
          backOfficeGateway.confirmAccess().pipe(
            map(() => signInSucceeded(session)),
            catchError((error: Error) => {
              sessionStore.clear();
              return of(signInFailed(failureOf(error)));
            }),
          ),
        ),
        catchError((error: Error) => of(signInFailed(failureOf(error)))),
      ),
    ),
  );
