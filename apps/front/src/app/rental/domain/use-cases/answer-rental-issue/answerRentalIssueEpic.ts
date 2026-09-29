import { createAction } from '@reduxjs/toolkit';
import { catchError, exhaustMap, filter, mergeMap, of } from 'rxjs';

import type { AppEpic } from '../../../../../store/AppEpic';
import { listReceivedRentalRequestsRequested } from '../list-received-rental-requests/listReceivedRentalRequestsEpic';

export const answerRentalIssueRequested = createAction<{ requestId: string; reply: string }>(
  'rental/answerRentalIssueRequested',
);
export const answerRentalIssueSucceeded = createAction<{ requestId: string }>(
  'rental/answerRentalIssueSucceeded',
);
export const answerRentalIssueFailed = createAction<{ requestId: string; errorCode: string }>(
  'rental/answerRentalIssueFailed',
);

// L'api répond sans corps : « Demandes reçues » est relue pour montrer la
// réponse à la place du formulaire.
export const answerRentalIssueEpic: AppEpic = (action$, _state$, { rentalGateway }) =>
  action$.pipe(
    filter(answerRentalIssueRequested.match),
    exhaustMap(({ payload }) =>
      rentalGateway.answerIssue(payload.requestId, payload.reply).pipe(
        mergeMap(() => [
          answerRentalIssueSucceeded({ requestId: payload.requestId }),
          listReceivedRentalRequestsRequested(),
        ]),
        catchError((error: Error) =>
          of(answerRentalIssueFailed({ requestId: payload.requestId, errorCode: error.message })),
        ),
      ),
    ),
  );
