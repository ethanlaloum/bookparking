import { createAction } from '@reduxjs/toolkit';
import { catchError, exhaustMap, filter, map, of } from 'rxjs';

import type { AppEpic } from '../../../../../store/AppEpic';
import type { ChangePasswordPayload } from '../../ports/AccountGateway';

export const changePasswordRequested = createAction<ChangePasswordPayload>(
  'account/changePasswordRequested',
);
export const changePasswordSucceeded = createAction('account/changePasswordSucceeded');
export const changePasswordFailed = createAction<{ errorCode: string }>(
  'account/changePasswordFailed',
);
export const resetChangePasswordState = createAction('account/resetChangePasswordState');

export const changePasswordEpic: AppEpic = (action$, _state$, { accountGateway }) =>
  action$.pipe(
    filter(changePasswordRequested.match),
    exhaustMap((action) =>
      accountGateway.changePassword(action.payload).pipe(
        map(() => changePasswordSucceeded()),
        catchError((error: Error) => of(changePasswordFailed({ errorCode: error.message }))),
      ),
    ),
  );
