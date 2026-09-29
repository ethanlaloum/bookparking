import { createAction } from '@reduxjs/toolkit';
import { catchError, exhaustMap, filter, map, of } from 'rxjs';

import type { AppEpic } from '../../../../../store/AppEpic';
import type { PayoutSummary } from '../../entities/Payout';

export const readPayoutsRequested = createAction('payout/readPayoutsRequested');
export const readPayoutsSucceeded = createAction<PayoutSummary>('payout/readPayoutsSucceeded');
export const readPayoutsFailed = createAction<{ errorCode: string }>('payout/readPayoutsFailed');

export const readPayoutsEpic: AppEpic = (action$, _state$, { payoutGateway }) =>
  action$.pipe(
    filter(readPayoutsRequested.match),
    exhaustMap(() =>
      payoutGateway.read().pipe(
        map((summary) => readPayoutsSucceeded(summary)),
        catchError((error: Error) => of(readPayoutsFailed({ errorCode: error.message }))),
      ),
    ),
  );
