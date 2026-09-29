import { createAction } from '@reduxjs/toolkit';
import { catchError, exhaustMap, filter, map, of } from 'rxjs';

import type { AppEpic } from '../../../../../store/AppEpic';
import type { AdminRentalIssue } from '../../entities/AdminRentalIssue';
import { failureOf, type Failure } from '../../ports/BackOfficeGateway';

export const listRentalIssuesRequested = createAction('backOffice/listRentalIssuesRequested');
export const listRentalIssuesSucceeded = createAction<AdminRentalIssue[]>(
  'backOffice/listRentalIssuesSucceeded',
);
export const listRentalIssuesFailed = createAction<Failure>('backOffice/listRentalIssuesFailed');

export const listRentalIssuesEpic: AppEpic = (action$, _state$, { backOfficeGateway }) =>
  action$.pipe(
    filter(listRentalIssuesRequested.match),
    exhaustMap(() =>
      backOfficeGateway.listIssues().pipe(
        map((issues) => listRentalIssuesSucceeded(issues)),
        catchError((error: Error) => of(listRentalIssuesFailed(failureOf(error)))),
      ),
    ),
  );
