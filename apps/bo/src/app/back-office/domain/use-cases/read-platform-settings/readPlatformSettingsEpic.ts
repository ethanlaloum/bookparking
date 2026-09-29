import { createAction } from '@reduxjs/toolkit';
import { catchError, exhaustMap, filter, map, of } from 'rxjs';

import type { AppEpic } from '../../../../../store/AppEpic';
import type { PlatformSettingsForm } from '../../entities/PlatformSettings';
import { failureOf, type Failure } from '../../ports/BackOfficeGateway';

export const readPlatformSettingsRequested = createAction('backOffice/readPlatformSettingsRequested');
export const readPlatformSettingsSucceeded = createAction<PlatformSettingsForm>(
  'backOffice/readPlatformSettingsSucceeded',
);
export const readPlatformSettingsFailed = createAction<Failure>('backOffice/readPlatformSettingsFailed');

export const readPlatformSettingsEpic: AppEpic = (action$, _state$, { backOfficeGateway }) =>
  action$.pipe(
    filter(readPlatformSettingsRequested.match),
    exhaustMap(() =>
      backOfficeGateway.readSettings().pipe(
        map((form) => readPlatformSettingsSucceeded(form)),
        catchError((error: Error) => of(readPlatformSettingsFailed(failureOf(error)))),
      ),
    ),
  );
