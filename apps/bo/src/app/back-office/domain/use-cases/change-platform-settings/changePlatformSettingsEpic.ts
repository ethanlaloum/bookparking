import { createAction } from '@reduxjs/toolkit';
import { catchError, exhaustMap, filter, mergeMap, of } from 'rxjs';

import type { AppEpic } from '../../../../../store/AppEpic';
import type { PlatformSettings } from '../../entities/PlatformSettings';
import { failureOf, type Failure } from '../../ports/BackOfficeGateway';
import { readAdminJournalRequested } from '../read-admin-journal/readAdminJournalEpic';
import { readPlatformSettingsRequested } from '../read-platform-settings/readPlatformSettingsEpic';

export interface ChangePlatformSettingsCommand {
  settings: PlatformSettings;
  reason: string;
}

export const changePlatformSettingsRequested = createAction<ChangePlatformSettingsCommand>(
  'backOffice/changePlatformSettingsRequested',
);
export const changePlatformSettingsSucceeded = createAction('backOffice/changePlatformSettingsSucceeded');
export const changePlatformSettingsFailed = createAction<Failure>('backOffice/changePlatformSettingsFailed');
export const resetChangePlatformSettings = createAction('backOffice/resetChangePlatformSettings');

/**
 * L'api répond 204 sans corps : les réglages en vigueur et le journal se
 * relisent, pour que l'écran montre la version écrite et la ligne qui la dit.
 */
export const changePlatformSettingsEpic: AppEpic = (action$, _state$, { backOfficeGateway }) =>
  action$.pipe(
    filter(changePlatformSettingsRequested.match),
    exhaustMap((action) =>
      backOfficeGateway.changeSettings(action.payload.settings, action.payload.reason).pipe(
        mergeMap(() => [
          changePlatformSettingsSucceeded(),
          readPlatformSettingsRequested(),
          readAdminJournalRequested(),
        ]),
        catchError((error: Error) => of(changePlatformSettingsFailed(failureOf(error)))),
      ),
    ),
  );
