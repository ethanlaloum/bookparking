import { ArrowLeft, ArrowRight, CircleCheck, Save } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';

import {
  editListingRequested,
  resetEditListingState,
} from '../app/listing/domain/use-cases/edit-listing/editListingEpic';
import { listOwnerListingsRequested } from '../app/listing/domain/use-cases/list-owner-listings/listOwnerListingsEpic';
import { NoParkingSign } from '../components/art/NoParkingSign';
import { ListingForm } from '../components/ListingForm';
import { Loader } from '../components/Loader';
import { Notice } from '../components/Notice';
import { buttonVariants } from '../components/ui/buttonVariants';
import { cn } from '../lib/cn';
import { todayAsCalendarDay } from '../lib/format';
import {
  selectEditableOwnerListing,
  selectEditListingError,
  selectEditListingLoading,
  selectEditListingSuccess,
  selectOwnerListingsError,
  selectOwnerListingsLoaded,
} from '../selectors/listing/listingSelectors';
import { useAppDispatch, useAppSelector } from '../store/redux';
import { listingContentOf, listingFormValuesOf, type ListingFormValues } from '../lib/listingFormValues';

const earlierDay = (first: string, second: string): string => (first < second ? first : second);

export const EditListingPage = () => {
  const { id = '' } = useParams<{ id: string }>();
  const { t } = useTranslation(['listing', 'common']);
  const dispatch = useAppDispatch();

  const listing = useAppSelector((state) => selectEditableOwnerListing(state, id));
  const loaded = useAppSelector(selectOwnerListingsLoaded);
  const loadError = useAppSelector(selectOwnerListingsError);
  const saving = useAppSelector(selectEditListingLoading);
  const error = useAppSelector(selectEditListingError);
  const saved = useAppSelector(selectEditListingSuccess);

  useEffect(() => {
    dispatch(listOwnerListingsRequested());
    return () => void dispatch(resetEditListingState());
  }, [dispatch]);

  const back = (
    <Link to={`/place/${id}`} className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), '-ml-2')}>
      <ArrowLeft className="size-4" aria-hidden="true" />
      {t('common:action.back')}
    </Link>
  );

  if (saved)
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
            {t('listing:edit.saved')}
          </h1>
          <p className="mt-3 text-lg text-fg-muted">{t('listing:edit.savedBody')}</p>
        </div>
        <Link to={`/place/${id}`} className={`${buttonVariants({ variant: 'primary', size: 'lg' })} mt-9`}>
          {t('listing:edit.seeIt')}
          <ArrowRight className="size-5" aria-hidden="true" />
        </Link>
      </div>
    );

  if (loadError !== null || (loaded && listing === null))
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center sm:px-6">
        <NoParkingSign className="size-24" />
        <h1 className="mt-8 font-display text-3xl font-bold text-fg">{t('listing:edit.notEditable')}</h1>
        <p className="mt-3 text-fg-muted">{loadError ?? t('listing:edit.notEditableBody')}</p>
        <Link to={`/place/${id}`} className={`${buttonVariants({ variant: 'outline' })} mt-8`}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          {t('common:action.back')}
        </Link>
      </div>
    );

  if (!loaded || listing === null) return <Loader />;

  const submit = (values: ListingFormValues): void => {
    dispatch(editListingRequested({ id: listing.id, listing: listingContentOf(values) }));
  };

  return (
    <div className="mx-auto max-w-[1320px] px-4 pt-6 pb-4 sm:px-6">
      {back}
      <div className="animate-rise mt-5 max-w-2xl">
        <h1 className="font-display text-[clamp(2.25rem,4.5vw,3.5rem)] leading-none font-bold tracking-[-0.035em] text-fg">
          {t('listing:edit.title')}
        </h1>
        <p className="mt-3 text-lg text-fg-muted">{t('listing:edit.subtitle')}</p>
      </div>

      <ListingForm
        key={listing.id}
        defaultValues={listingFormValuesOf(listing)}
        placeLocked
        firstSelectableDay={earlierDay(todayAsCalendarDay(), listing.availability.from.slice(0, 10))}
        submitLabel={t('listing:edit.submit')}
        submitIcon={Save}
        loading={saving}
        error={error}
        notice={<Notice tone="info">{t('listing:edit.bookingsKept')}</Notice>}
        onSubmit={submit}
      />
    </div>
  );
};
