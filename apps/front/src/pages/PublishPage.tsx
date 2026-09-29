import { ArrowRight, CircleCheck, Send } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import {
  publishListingRequested,
  resetPublishListingState,
} from '../app/listing/domain/use-cases/publish-listing/publishListingEpic';
import { ListingForm } from '../components/ListingForm';
import { buttonVariants } from '../components/ui/buttonVariants';
import { todayAsCalendarDay } from '../lib/format';
import {
  selectPublishError,
  selectPublishLoading,
  selectPublishSuccess,
} from '../selectors/listing/listingSelectors';
import { useAppDispatch, useAppSelector } from '../store/redux';
import { EMPTY_LISTING_FORM, listingContentOf, type ListingFormValues } from '../lib/listingFormValues';

const STEPS = ['place', 'pricing', 'availability'] as const;

export const PublishPage = () => {
  const { t } = useTranslation(['listing', 'common']);
  const dispatch = useAppDispatch();

  const loading = useAppSelector(selectPublishLoading);
  const error = useAppSelector(selectPublishError);
  const success = useAppSelector(selectPublishSuccess);

  useEffect(() => () => void dispatch(resetPublishListingState()), [dispatch]);

  const submit = (values: ListingFormValues): void => {
    dispatch(
      publishListingRequested({ address: values.address, box: values.box, ...listingContentOf(values) }),
    );
  };

  if (success)
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center sm:px-6">
        <span className="relative grid place-items-center">
          <span aria-hidden="true" className="animate-pulse-ring absolute inset-0 rounded-full bg-ok/40" />
          <span className="relative grid size-20 place-items-center rounded-full bg-ok-bg text-ok ring-1 ring-ok/30">
            <CircleCheck className="size-10" aria-hidden="true" />
          </span>
        </span>
        <div role="status" className="animate-rise mt-8">
          <h1 className="font-display text-[clamp(2rem,4vw,3rem)] leading-tight font-bold text-fg">
            {t('listing:publish.published')}
          </h1>
          <p className="mt-3 text-lg text-fg-muted">{t('listing:publish.subtitle')}</p>
        </div>
        <Link to="/recherche" className={`${buttonVariants({ variant: 'primary', size: 'lg' })} mt-9`}>
          {t('listing:publish.seeIt')}
          <ArrowRight className="size-5" aria-hidden="true" />
        </Link>
      </div>
    );

  return (
    <div className="mx-auto max-w-[1320px] px-4 pt-8 pb-4 sm:px-6">
      <div className="animate-rise max-w-2xl">
        <h1 className="font-display text-[clamp(2.25rem,4.5vw,3.5rem)] leading-none font-bold tracking-[-0.035em] text-fg">
          {t('listing:publish.title')}
        </h1>
        <p className="mt-3 text-lg text-fg-muted">{t('listing:publish.subtitle')}</p>
      </div>

      <ol className="mt-8 flex flex-wrap gap-2">
        {STEPS.map((step, index) => (
          <li
            key={step}
            className="inline-flex items-center gap-2.5 rounded-full border border-line bg-bg-raised py-1.5 pr-4 pl-1.5 text-sm"
          >
            <span className="tabular grid size-7 place-items-center rounded-full bg-brand font-mono text-xs font-semibold text-on-brand">
              {index + 1}
            </span>
            <span className="font-medium text-fg-muted">{t(`listing:publish.step.${step}`)}</span>
          </li>
        ))}
      </ol>

      <ListingForm
        defaultValues={EMPTY_LISTING_FORM}
        firstSelectableDay={todayAsCalendarDay()}
        submitLabel={t('listing:publish.submit')}
        submitIcon={Send}
        loading={loading}
        error={error}
        onSubmit={submit}
      />
    </div>
  );
};

