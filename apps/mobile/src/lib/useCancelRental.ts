import * as Haptics from 'expo-haptics';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { cancellationTermsOf } from '@front/app/rental/domain/entities/RentalCancellation';
import type { RentalRequestView } from '@front/app/rental/domain/entities/RentalRequestView';
import { cancelRentalRequested } from '@front/app/rental/domain/use-cases/cancel-rental/cancelRentalEpic';

import { useAppDispatch } from '../store/redux';

/**
 * Ce que coûte l'annulation se lit avant de la confirmer — `cancellationTermsOf`
 * en décide, le même partage que l'api, qui reste le juge. La fenêtre de
 * confirmation est l'alerte du système : deux boutons, le destructif en rouge,
 * et « garder » en premier, comme la modale muette du site.
 *
 * L'instant de comparaison est figé au montage de l'écran, comme sur le site :
 * chaque ligne lit la même horloge. Un écran resté ouvert peut proposer une
 * annulation devenue impossible ; l'api répond alors 409.
 */
export const useCancelRental = () => {
  const { t } = useTranslation('account');
  const dispatch = useAppDispatch();
  const now = useMemo(() => new Date(), []);

  const termsFor = (request: RentalRequestView, perspective: 'renter' | 'owner') =>
    cancellationTermsOf(request, perspective, now);

  const offer = (request: RentalRequestView, perspective: 'renter' | 'owner'): void => {
    const terms = termsFor(request, perspective);
    if (terms.kind === 'unavailable') return;
    const owner = perspective === 'owner';
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      t('cancel.title'),
      `${request.address} · ${request.box}\n\n${t(`cancel.terms.${terms.kind}`, { amount: terms.amount })}`,
      [
        { text: owner ? t('cancel.ownerKeep') : t('cancel.keep'), style: 'cancel' },
        {
          text: owner ? t('cancel.ownerConfirm') : t('cancel.confirm'),
          style: 'destructive',
          onPress: () => dispatch(cancelRentalRequested({ requestId: request.id })),
        },
      ],
    );
  };

  const cancellable = (request: RentalRequestView, perspective: 'renter' | 'owner'): boolean =>
    termsFor(request, perspective).kind !== 'unavailable';

  return { offer, cancellable };
};
