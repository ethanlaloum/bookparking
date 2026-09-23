import { ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';

import {
  confirmRentalRequestRequested,
  resetConfirmRentalRequestState,
} from '../app/rental/domain/use-cases/confirm-rental-request/confirmRentalRequestEpic';
import { Notice } from '../components/Notice';
import { ParkingMark } from '../components/ParkingMark';
import { Button } from '../components/ui/button';
import { buttonVariants } from '../components/ui/buttonVariants';
import { Card } from '../components/ui/card';
import { Spinner } from '../components/ui/spinner';
import {
  selectConfirmRentalError,
  selectConfirmRentalLoading,
  selectConfirmRentalSuccess,
} from '../selectors/rental/rentalSelectors';
import { useAppDispatch, useAppSelector } from '../store/redux';

export const ConfirmRequestPage = () => {
  const { requestId = '' } = useParams<{ requestId: string }>();
  const { t } = useTranslation(['rental', 'common']);
  const dispatch = useAppDispatch();

  const loading = useAppSelector(selectConfirmRentalLoading);
  const error = useAppSelector(selectConfirmRentalError);
  const success = useAppSelector(selectConfirmRentalSuccess);

  useEffect(() => () => void dispatch(resetConfirmRentalRequestState()), [dispatch]);

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
      <ParkingMark className="size-11" />
      <h1 className="mt-7 font-display text-[clamp(2rem,4vw,2.75rem)] leading-tight font-bold text-fg">
        {t('rental:confirm.title')}
      </h1>

      <Card className="mt-8 p-6 shadow-[var(--shadow-lift)] sm:p-7">
        {requestId === '' ? (
          <Notice tone="error">{t('rental:confirm.missingId')}</Notice>
        ) : success ? (
          <Notice tone="success" title={t('rental:confirm.done')}>
            {t('rental:confirm.doneBody')}
          </Notice>
        ) : (
          <>
            <p className="text-sm text-fg-muted">{t('rental:confirm.subtitle', { id: requestId })}</p>

            <dl className="mt-5 rounded-2xl border border-dashed border-line-strong bg-bg-sunken p-4">
              <dt className="label-ticket text-fg-subtle">{t('rental:confirm.idLabel')}</dt>
              <dd className="tabular mt-1.5 font-mono text-sm break-all text-fg">{requestId}</dd>
            </dl>

            <p className="mt-3 text-xs text-fg-subtle">{t('rental:confirm.idHint')}</p>

            {error !== null && (
              <Notice tone="error" title={t('common:error.title')} className="mt-5">
                {error}
              </Notice>
            )}

            <Button
              block
              size="lg"
              className="mt-6"
              disabled={loading}
              onClick={() => dispatch(confirmRentalRequestRequested({ requestId }))}
            >
              {loading && <Spinner />}
              {t('rental:confirm.submit')}
            </Button>
          </>
        )}

        <Link to="/" className={`${buttonVariants({ variant: 'ghost', size: 'sm' })} mt-4 -ml-2`}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          {t('common:action.back')}
        </Link>
      </Card>
    </div>
  );
};
