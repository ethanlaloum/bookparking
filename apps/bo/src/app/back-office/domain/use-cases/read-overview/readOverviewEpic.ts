import { createAction } from '@reduxjs/toolkit';
import { catchError, exhaustMap, filter, map, of } from 'rxjs';

import type { AppEpic } from '../../../../../store/AppEpic';
import type { Overview } from '../../entities/Overview';
import { failureOf, type Failure } from '../../ports/BackOfficeGateway';

export const readOverviewRequested = createAction('backOffice/readOverviewRequested');
export const readOverviewSucceeded = createAction<Overview>('backOffice/readOverviewSucceeded');
export const readOverviewFailed = createAction<Failure>('backOffice/readOverviewFailed');

/**
 * La première lecture de l'application, et celle qui tranche le droit : l'api
 * ne dit nulle part qu'un compte administre le site, et `POST /session` ne rend
 * qu'un jeton. C'est le 403 d'ici qui l'apprend à l'écran.
 */
export const readOverviewEpic: AppEpic = (action$, _state$, { backOfficeGateway }) =>
  action$.pipe(
    filter(readOverviewRequested.match),
    exhaustMap(() =>
      backOfficeGateway.readOverview().pipe(
        map((overview) => readOverviewSucceeded(overview)),
        catchError((error: Error) => of(readOverviewFailed(failureOf(error)))),
      ),
    ),
  );
