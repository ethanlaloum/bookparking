import { createAction } from '@reduxjs/toolkit';
import { catchError, exhaustMap, filter, map, of } from 'rxjs';

import type { AppEpic } from '../../../../../store/AppEpic';
import type { ResetPasswordPayload } from '../../ports/AccountGateway';

export const chooseNewPasswordRequested = createAction<ResetPasswordPayload>(
  'account/chooseNewPasswordRequested',
);
export const chooseNewPasswordSucceeded = createAction('account/chooseNewPasswordSucceeded');
export const chooseNewPasswordFailed = createAction<{ errorCode: string }>(
  'account/chooseNewPasswordFailed',
);
export const resetChooseNewPasswordState = createAction('account/resetChooseNewPasswordState');

export const chooseNewPasswordEpic: AppEpic = (action$, _state$, { accountGateway }) =>
  action$.pipe(
    filter(chooseNewPasswordRequested.match),
    exhaustMap((action) =>
      accountGateway.resetPassword(action.payload).pipe(
        map(() => chooseNewPasswordSucceeded()),
        catchError((error: Error) => of(chooseNewPasswordFailed({ errorCode: error.message }))),
      ),
    ),
  );
