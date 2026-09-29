import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { readRentalTermsRequested } from '../app/rental-terms/domain/use-cases/read-rental-terms/readRentalTermsEpic';
import { formatCount } from '../lib/format';
import {
  selectRentalTerms,
  selectRentalTermsError,
} from '../selectors/rental-terms/rentalTermsSelectors';
import { useAppDispatch, useAppSelector } from '../store/redux';

export interface RentalTermsTexts {
  fee: string;
  freeCancellation: string;
  expiry: string;
  release: string;
}

/**
 * Les conditions de location, prêtes à glisser dans une phrase : « 48 heures »,
 * « 1 heure », « 12,5 ». Relues à chaque page qui les cite, parce que le
 * back-office peut les avoir changées depuis la visite précédente ; `null`
 * tant que l'api n'a pas répondu, pour qu'aucun chiffre périmé ne s'affiche.
 */
export const useRentalTerms = (): {
  texts: RentalTermsTexts | null;
  error: string | null;
  retry: () => void;
} => {
  const { t } = useTranslation('common');
  const dispatch = useAppDispatch();
  const terms = useAppSelector(selectRentalTerms);
  const error = useAppSelector(selectRentalTermsError);
  const retry = useCallback(() => void dispatch(readRentalTermsRequested()), [dispatch]);

  useEffect(retry, [retry]);

  const hours = (count: number) => t('unit.hour', { count });

  return {
    texts:
      terms === null
        ? null
        : {
            fee: formatCount(terms.platformFeePercent),
            freeCancellation: hours(terms.freeCancellationHours),
            expiry: hours(terms.requestExpiryHours),
            release: hours(terms.payoutReleaseDelayHours),
          },
    error,
    retry,
  };
};
