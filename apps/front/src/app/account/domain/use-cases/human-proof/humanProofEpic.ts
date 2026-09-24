import { createAction } from '@reduxjs/toolkit';
import { catchError, filter, map, merge, of, switchMap } from 'rxjs';

import type { AppEpic } from '../../../../../store/AppEpic';
import { solveHumanChallenge, type HumanProof } from '../../entities/HumanProof';
import { registerAccountFailed } from '../register-account/registerAccountEpic';

export const humanProofRequested = createAction('account/humanProofRequested');
export const humanProofSolved = createAction<HumanProof>('account/humanProofSolved');
export const humanProofFailed = createAction<{ errorCode: string }>('account/humanProofFailed');

const UNSOLVABLE_CHALLENGE = 'Défi anti-robot insoluble';

/**
 * SPEC-007 RG-03. L'écran d'inscription demande un défi dès qu'il s'ouvre, et
 * le résout aussitôt : la preuve est prête avant que le formulaire ne le soit.
 * L'api dépense une preuve à chaque inscription tentée, réussie ou non ; après
 * un refus, il en faut donc une neuve — d'où la seconde source.
 */
export const humanProofEpic: AppEpic = (action$, _state$, { accountGateway }) =>
  merge(
    action$.pipe(filter(humanProofRequested.match)),
    action$.pipe(filter(registerAccountFailed.match)),
  ).pipe(
    switchMap(() =>
      accountGateway.getHumanChallenge().pipe(
        map((challenge) => {
          const proof = solveHumanChallenge(challenge);
          return proof === null
            ? humanProofFailed({ errorCode: UNSOLVABLE_CHALLENGE })
            : humanProofSolved(proof);
        }),
        catchError((error: Error) => of(humanProofFailed({ errorCode: error.message }))),
      ),
    ),
  );
