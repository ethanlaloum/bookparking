import { createAction } from '@reduxjs/toolkit';
import { catchError, exhaustMap, filter, map, of } from 'rxjs';

import type { AppEpic } from '../../../../../store/AppEpic';
import type { AdminAccount } from '../../entities/AdminAccount';
import { failureOf, type Failure } from '../../ports/BackOfficeGateway';

export const listAccountsRequested = createAction('backOffice/listAccountsRequested');
export const listAccountsSucceeded = createAction<AdminAccount[]>(
  'backOffice/listAccountsSucceeded',
);
export const listAccountsFailed = createAction<Failure>('backOffice/listAccountsFailed');

export const listAccountsEpic: AppEpic = (action$, _state$, { backOfficeGateway }) =>
  action$.pipe(
    filter(listAccountsRequested.match),
    exhaustMap(() =>
      backOfficeGateway.listAccounts().pipe(
        map((accounts) => listAccountsSucceeded(accounts)),
        catchError((error: Error) => of(listAccountsFailed(failureOf(error)))),
      ),
    ),
  );
