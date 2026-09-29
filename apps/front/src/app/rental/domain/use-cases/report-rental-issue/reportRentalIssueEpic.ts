import { createAction } from '@reduxjs/toolkit';
import { catchError, exhaustMap, filter, mergeMap, of } from 'rxjs';

import type { AppEpic } from '../../../../../store/AppEpic';
import type { IssueReport } from '../../ports/RentalGateway';
import { listMyRentalRequestsRequested } from '../list-my-rental-requests/listMyRentalRequestsEpic';

export const reportRentalIssueRequested = createAction<{ requestId: string; report: IssueReport }>(
  'rental/reportRentalIssueRequested',
);
export const reportRentalIssueSucceeded = createAction<{ requestId: string }>(
  'rental/reportRentalIssueSucceeded',
);
export const reportRentalIssueFailed = createAction<{ errorCode: string }>(
  'rental/reportRentalIssueFailed',
);
export const resetReportRentalIssue = createAction('rental/resetReportRentalIssue');

// L'api répond sans corps : « Mes réservations » est relue pour montrer la
// réclamation, et le bouton « Je suis arrivé » qu'elle retire.
export const reportRentalIssueEpic: AppEpic = (action$, _state$, { rentalGateway }) =>
  action$.pipe(
    filter(reportRentalIssueRequested.match),
    exhaustMap(({ payload }) =>
      rentalGateway.reportIssue(payload.requestId, payload.report).pipe(
        mergeMap(() => [
          reportRentalIssueSucceeded({ requestId: payload.requestId }),
          listMyRentalRequestsRequested(),
        ]),
        catchError((error: Error) => of(reportRentalIssueFailed({ errorCode: error.message }))),
      ),
    ),
  );
