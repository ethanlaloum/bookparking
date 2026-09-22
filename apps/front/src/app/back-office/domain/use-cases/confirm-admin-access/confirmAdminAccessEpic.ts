import { createAction } from '@reduxjs/toolkit';
import { catchError, exhaustMap, filter, map, of } from 'rxjs';

import type { AppEpic } from '../../../../../store/AppEpic';
import { failureOf, type Failure } from '../../ports/BackOfficeGateway';

export const confirmAdminAccessRequested = createAction(
  'backOffice/confirmAdminAccessRequested',
);
export const confirmAdminAccessSucceeded = createAction(
  'backOffice/confirmAdminAccessSucceeded',
);
export const confirmAdminAccessFailed = createAction<Failure>(
  'backOffice/confirmAdminAccessFailed',
);

/**
 * La sonde du tableau de bord : l'api ne dit nulle part qu'un compte
 * administre le site, et `POST /session` ne rend qu'un jeton. `GET
 * /admin/access` répond 204 ou 403, et c'est de là que le tableau de bord tire
 * — ou non — ses onglets d'administration.
 *
 * Un échec qui n'est pas un 403 laisse l'accès `unknown` : un réseau coupé ne
 * doit pas conclure qu'un administrateur n'en est pas un.
 */
export const confirmAdminAccessEpic: AppEpic = (action$, _state$, { backOfficeGateway }) =>
  action$.pipe(
    filter(confirmAdminAccessRequested.match),
    exhaustMap(() =>
      backOfficeGateway.confirmAccess().pipe(
        map(() => confirmAdminAccessSucceeded()),
        catchError((error: Error) => of(confirmAdminAccessFailed(failureOf(error)))),
      ),
    ),
  );
