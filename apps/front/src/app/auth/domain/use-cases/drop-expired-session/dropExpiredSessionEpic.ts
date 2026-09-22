import type { Action } from '@reduxjs/toolkit';
import { filter, map } from 'rxjs';

import type { AppEpic } from '../../../../../store/AppEpic';
import { logoutRequested } from '../sign-out/signOutEpic';

/**
 * Le tableau de bord tire quatre lectures d'un coup. Quand le jeton vient
 * d'expirer, les quatre reviennent en 401 : sans cet epic, l'écran empilerait
 * quatre bandeaux rouges, et l'administrateur devrait deviner qu'il faut se
 * reconnecter. Un seul `kind` déclenche la déconnexion, et le premier suffit —
 * `logoutSucceeded` remet les tranches à zéro, les suivants n'ont plus rien à
 * afficher.
 */
const carriesExpiredSession = (action: Action): boolean => {
  const payload: unknown = (action as { payload?: unknown }).payload;
  if (typeof payload !== 'object' || payload === null) return false;
  return (payload as { kind?: unknown }).kind === 'session-expired';
};

export const dropExpiredSessionEpic: AppEpic = (action$) =>
  action$.pipe(
    filter(carriesExpiredSession),
    map(() => logoutRequested()),
  );
