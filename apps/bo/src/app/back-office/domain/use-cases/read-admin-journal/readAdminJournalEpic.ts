import { createAction } from '@reduxjs/toolkit';
import { catchError, exhaustMap, filter, map, of } from 'rxjs';

import type { AppEpic } from '../../../../../store/AppEpic';
import type { AdminJournalEntry } from '../../entities/AdminJournalEntry';
import { failureOf, type Failure } from '../../ports/BackOfficeGateway';

export const readAdminJournalRequested = createAction('backOffice/readAdminJournalRequested');
export const readAdminJournalSucceeded = createAction<AdminJournalEntry[]>(
  'backOffice/readAdminJournalSucceeded',
);
export const readAdminJournalFailed = createAction<Failure>('backOffice/readAdminJournalFailed');

export const readAdminJournalEpic: AppEpic = (action$, _state$, { backOfficeGateway }) =>
  action$.pipe(
    filter(readAdminJournalRequested.match),
    exhaustMap(() =>
      backOfficeGateway.readJournal().pipe(
        map((entries) => readAdminJournalSucceeded(entries)),
        catchError((error: Error) => of(readAdminJournalFailed(failureOf(error)))),
      ),
    ),
  );
