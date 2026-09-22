import { useCallback, useState } from 'react';

import { cancelRentalRequestRequested } from '../app/back-office/domain/use-cases/cancel-rental-request/cancelRentalRequestEpic';
import { liftAccountSuspensionRequested } from '../app/back-office/domain/use-cases/lift-account-suspension/liftAccountSuspensionEpic';
import { suspendAccountRequested } from '../app/back-office/domain/use-cases/suspend-account/suspendAccountEpic';
import { unpublishListingRequested } from '../app/back-office/domain/use-cases/unpublish-listing/unpublishListingEpic';
import { resetModerationState } from '../app/back-office/store/resetModerationState';
import {
  selectLastModeratedId,
  selectModerationError,
  selectModerationLoading,
  selectModerationSuccess,
} from '../selectors/back-office/backOfficeSelectors';
import { useAppDispatch, useAppSelector } from '../store/redux';

export type ModerationKind = 'unpublish' | 'suspend' | 'lift' | 'cancelRequest';

export interface ModerationTarget {
  kind: ModerationKind;
  targetId: string;
  /** Ce que l'administrateur reconnaît : une adresse e-mail, une adresse postale. */
  label: string;
}

const ACTION_BY_KIND = {
  unpublish: unpublishListingRequested,
  suspend: suspendAccountRequested,
  lift: liftAccountSuspensionRequested,
  cancelRequest: cancelRentalRequestRequested,
} as const;

/**
 * Les trois listes partagent une seule modale, et donc un seul état local :
 * quelle cible, et rien d'autre. L'état de l'action elle-même — en cours,
 * refusée, aboutie — vit dans le store, où l'epic le dépose.
 *
 * La fermeture après un succès est **dérivée**, jamais posée dans un
 * `useEffect` : un `setState` synchrone dans un effet déclenche des rendus en
 * cascade, et le linter React le refuse. La remise à zéro du store appartient
 * aux deux gestes de l'utilisateur — ouvrir une autre modale, ou fermer
 * celle-ci.
 */
export const useModeration = () => {
  const dispatch = useAppDispatch();
  const [asked, setAsked] = useState<ModerationTarget | null>(null);

  const pending = useAppSelector(selectModerationLoading);
  const error = useAppSelector(selectModerationError);
  const succeeded = useAppSelector(selectModerationSuccess);
  const lastModeratedId = useAppSelector(selectLastModeratedId);

  // L'api répond 204 sans corps : le succès est le seul signal que la modale a
  // fini son travail. On compare l'identifiant pour qu'un succès laissé par une
  // action précédente ne ferme pas la modale suivante avant qu'elle ne serve.
  const settled = succeeded && asked !== null && lastModeratedId === asked.targetId;
  const target = settled ? null : asked;

  const ask = useCallback(
    (next: ModerationTarget) => {
      dispatch(resetModerationState());
      setAsked(next);
    },
    [dispatch],
  );

  const close = useCallback(() => {
    dispatch(resetModerationState());
    setAsked(null);
  }, [dispatch]);

  const confirm = useCallback(
    (reason: string) => {
      if (target === null) return;
      dispatch(ACTION_BY_KIND[target.kind]({ targetId: target.targetId, reason }));
    },
    [dispatch, target],
  );

  return { target, ask, close, confirm, pending, error };
};
