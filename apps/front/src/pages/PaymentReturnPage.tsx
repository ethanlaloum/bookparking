import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { moneyLabelOf } from '../app/rental/domain/entities/RentalRequestView';
import { abandonRentalRequestRequested } from '../app/rental/domain/use-cases/abandon-rental-request/abandonRentalRequestEpic';
import { listMyRentalRequestsRequested } from '../app/rental/domain/use-cases/list-my-rental-requests/listMyRentalRequestsEpic';
import { Notice } from '../components/Notice';
import { ParkingMark } from '../components/ParkingMark';
import { buttonVariants } from '../components/ui/buttonVariants';
import { Card } from '../components/ui/card';
import { Spinner } from '../components/ui/spinner';
import {
  selectAbandonedRentalRequestId,
  selectAbandonRentalRequestFailed,
  selectMyRentalRequests,
  selectMyRentalRequestsLoaded,
} from '../selectors/rental/rentalSelectors';
import { useAppDispatch, useAppSelector } from '../store/redux';

const POLL_EVERY_MILLISECONDS = 2000;
const MAXIMUM_POLLS = 30;

/**
 * Là où Stripe renvoie le conducteur. Le retour du navigateur ne vaut pas
 * paiement : seul l'événement signé de Stripe fait passer la demande au
 * propriétaire, et il peut arriver après le navigateur. La page relit donc la
 * demande jusqu'à le voir, une minute au plus. Revenu sans payer (`?abandon=1`),
 * le conducteur est ramené sur la fiche une fois ses dates rendues.
 */
export const PaymentReturnPage = () => {
  const { requestId = '' } = useParams<{ requestId: string }>();
  const [searchParams] = useSearchParams();
  const abandoning = searchParams.get('abandon') === '1';
  const { t } = useTranslation(['rental', 'account', 'common']);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const mine = useAppSelector(selectMyRentalRequests);
  const loaded = useAppSelector(selectMyRentalRequestsLoaded);
  const abandonedId = useAppSelector(selectAbandonedRentalRequestId);
  const abandonFailed = useAppSelector(selectAbandonRentalRequestFailed);
  const [polls, setPolls] = useState(0);

  const request = mine.find((candidate) => candidate.id === requestId) ?? null;
  const awaiting = request === null || request.status === 'AWAITING_PAYMENT';

  useEffect(() => {
    if (requestId === '') return;
    if (abandoning) dispatch(abandonRentalRequestRequested({ requestId }));
    dispatch(listMyRentalRequestsRequested());
  }, [abandoning, dispatch, requestId]);

  useEffect(() => {
    if (!abandoning || abandonedId !== requestId || !loaded) return;
    const back = request === null ? '/recherche' : `/place/${request.listingId}?paiement=abandonne`;
    void navigate(back, { replace: true });
  }, [abandoning, abandonedId, loaded, navigate, request, requestId]);

  useEffect(() => {
    if ((abandoning && !abandonFailed) || !awaiting || polls >= MAXIMUM_POLLS) return;
    const timer = setTimeout(() => {
      setPolls((current) => current + 1);
      dispatch(listMyRentalRequestsRequested());
    }, POLL_EVERY_MILLISECONDS);
    return () => clearTimeout(timer);
  }, [abandoning, abandonFailed, awaiting, dispatch, polls]);

  const heading =
    abandoning && !abandonFailed
      ? t('rental:payment.abandoning')
      : awaiting
        ? t('rental:payment.verifying')
        : t('rental:payment.sent');

  const money = request === null ? null : moneyLabelOf(request);

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
      <ParkingMark className="size-11" />
      <p className="label-ticket mt-7 text-fg-subtle">{t('rental:payment.title')}</p>
      <h1 className="mt-2 font-display text-[clamp(2rem,4vw,2.75rem)] leading-tight font-bold text-fg">
        {heading}
      </h1>

      <Card className="mt-8 p-6 shadow-[var(--shadow-lift)] sm:p-7">
        {abandoning && !abandonFailed ? (
          <p className="flex items-center gap-3 text-sm text-fg-muted">
            <Spinner />
            {t('rental:payment.abandoning')}
          </p>
        ) : loaded && request === null && polls >= MAXIMUM_POLLS ? (
          <Notice tone="error">{t('rental:payment.notFound')}</Notice>
        ) : awaiting ? (
          polls >= MAXIMUM_POLLS ? (
            <Notice tone="info">{t('rental:payment.slow')}</Notice>
          ) : (
            <p className="flex items-center gap-3 text-sm text-fg-muted" role="status">
              <Spinner />
              {t('rental:payment.verifyingBody')}
            </p>
          )
        ) : (
          <>
            <p className="font-medium text-fg" role="status">
              {money !== null && t(`account:money.${money.key}`, { amount: money.amount })}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-fg-muted">
              {t('rental:payment.sentBody')}
            </p>
          </>
        )}

        <Link to="/compte" className={`${buttonVariants({ variant: 'outline' })} mt-6`}>
          {t('rental:payment.toMyRequests')}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </Card>
    </div>
  );
};
