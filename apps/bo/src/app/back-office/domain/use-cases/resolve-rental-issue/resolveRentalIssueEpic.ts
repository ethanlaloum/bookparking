import { createAction } from '@reduxjs/toolkit';
import { catchError, exhaustMap, filter, mergeMap, of } from 'rxjs';

import type { AppEpic } from '../../../../../store/AppEpic';
import type { IssueResolution } from '../../entities/AdminRentalIssue';
import { failureOf, type Failure } from '../../ports/BackOfficeGateway';
import { listRentalIssuesRequested } from '../list-rental-issues/listRentalIssuesEpic';
import { readAdminJournalRequested } from '../read-admin-journal/readAdminJournalEpic';
import { readOverviewRequested } from '../read-overview/readOverviewEpic';

export const resolveRentalIssueRequested = createAction<{
  issueId: string;
  resolution: IssueResolution;
}>('backOffice/resolveRentalIssueRequested');
export const resolveRentalIssueSucceeded = createAction<{ issueId: string }>(
  'backOffice/resolveRentalIssueSucceeded',
);
export const resolveRentalIssueFailed = createAction<Failure>('backOffice/resolveRentalIssueFailed');
export const resetResolveRentalIssue = createAction('backOffice/resetResolveRentalIssue');

/**
 * L'api répond 204 sans corps : la liste des réclamations se relit, le tableau
 * de bord (qui les compte) et le journal (qui écrit la décision) avec elle.
 */
export const resolveRentalIssueEpic: AppEpic = (action$, _state$, { backOfficeGateway }) =>
  action$.pipe(
    filter(resolveRentalIssueRequested.match),
    exhaustMap(({ payload }) =>
      backOfficeGateway.resolveIssue(payload.issueId, payload.resolution).pipe(
        mergeMap(() => [
          resolveRentalIssueSucceeded({ issueId: payload.issueId }),
          listRentalIssuesRequested(),
          readOverviewRequested(),
          readAdminJournalRequested(),
        ]),
        catchError((error: Error) => of(resolveRentalIssueFailed(failureOf(error)))),
      ),
    ),
  );
