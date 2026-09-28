import { createAction } from '@reduxjs/toolkit';
import { catchError, exhaustMap, filter, map, of } from 'rxjs';

import type { AppEpic } from '../../../../../store/AppEpic';

export const requestPasswordResetRequested = createAction<string>(
  'account/requestPasswordResetRequested',
);
export const requestPasswordResetSucceeded = createAction<string>(
  'account/requestPasswordResetSucceeded',
);
export const requestPasswordResetFailed = createAction<{ errorCode: string }>(
  'account/requestPasswordResetFailed',
);
export const resetRequestPasswordResetState = createAction('account/resetRequestPasswordResetState');

export const requestPasswordResetEpic: AppEpic = (action$, _state$, { accountGateway }) =>
  action$.pipe(
    filter(requestPasswordResetRequested.match),
    exhaustMap((action) =>
      accountGateway.requestPasswordReset(action.payload).pipe(
        map(() => requestPasswordResetSucceeded(action.payload)),
        catchError((error: Error) => of(requestPasswordResetFailed({ errorCode: error.message }))),
      ),
    ),
  );
