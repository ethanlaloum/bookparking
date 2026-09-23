import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  CalendarRange,
  ImageIcon,
  KeyRound,
  MapPin,
  PencilLine,
  Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useParams, useSearchParams } from 'react-router-dom';

import {
  cheapestNightlyRateInCents,
  dayCountOf,
  estimateRentalPriceInCents,
  isListingAvailableOn,
} from '../app/listing/domain/entities/Listing';
import {
  getListingRequested,
  resetGetListingState,
} from '../app/listing/domain/use-cases/get-listing/getListingEpic';
import { unpublishListingRequested } from '../app/listing/domain/use-cases/unpublish-listing/unpublishListingEpic';
import { updateListingPricingRequested } from '../app/listing/domain/use-cases/update-listing-pricing/updateListingPricingEpic';
import { problemWithRequestedPeriod } from '../app/rental/domain/entities/RentalRequest';
import {
  requestRentalRequested,
  resetRequestRentalState,
} from '../app/rental/domain/use-cases/request-rental/requestRentalEpic';
import { BayScene } from '../components/art/BayScene';
import { DateRangeField } from '../components/DateRangeField';
import { NoParkingSign } from '../components/art/NoParkingSign';
import { Notice } from '../components/Notice';
import { PricingGrid } from '../components/PricingGrid';
import { VehicleBadges } from '../components/VehicleBadges';
import { Button } from '../components/ui/button';
import { buttonVariants } from '../components/ui/buttonVariants';
import { Badge } from '../components/ui/badge';
import { Field } from '../components/ui/field';
import { Input } from '../components/ui/input';
import { Skeleton } from '../components/ui/skeleton';
import { Spinner } from '../components/ui/spinner';
import { cn } from '../lib/cn';
import { centsFromInput, formatCents, formatDay, inputFromCents, todayAsCalendarDay } from '../lib/format';
import { pricingSchema, type PricingValues } from './pricingSchema';
import { selectIsAuthenticated } from '../selectors/auth/authSelectors';
import {
  selectListingError,
  selectListingLoading,
  selectSelectedListing,
  selectUnpublishError,
  selectUnpublishLoading,
  selectUpdatePricingError,
  selectUpdatePricingLoading,
  selectUpdatePricingSuccess,
} from '../selectors/listing/listingSelectors';
import {
  selectRequestRentalError,
  selectRequestRentalLoading,
  selectRequestRentalSuccess,
} from '../selectors/rental/rentalSelectors';
import { useAppDispatch, useAppSelector } from '../store/redux';

const laterDay = (first: string, second: string): string => (first > second ? first : second);

export const ListingDetailPage = () => {
  const { id = '' } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const paymentAbandoned = searchParams.get('paiement') === 'abandonne';
  const { t } = useTranslation(['listing', 'rental', 'common']);
  const dispatch = useAppDispatch();

  const listing = useAppSelector(selectSelectedListing);
  const loading = useAppSelector(selectListingLoading);
  const error = useAppSelector(selectListingError);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const [fromDay, setFromDay] = useState('');
  const [toDay, setToDay] = useState('');
  const [editingPricing, setEditingPricing] = useState(false);

  const bookingError = useAppSelector(selectRequestRentalError);
  const booking = useAppSelector(selectRequestRentalLoading);
  const booked = useAppSelector(selectRequestRentalSuccess);
  const unpublishing = useAppSelector(selectUnpublishLoading);
  const unpublishError = useAppSelector(selectUnpublishError);
  const repricing = useAppSelector(selectUpdatePricingLoading);
  const repriceError = useAppSelector(selectUpdatePricingError);
  const repriced = useAppSelector(selectUpdatePricingSuccess);

  useEffect(() => {
    dispatch(getListingRequested({ id }));
    return () => {
      dispatch(resetGetListingState());
      dispatch(resetRequestRentalState());
    };
  }, [dispatch, id]);

  const form = useForm<PricingValues>({
    resolver: zodResolver(pricingSchema),
    values: {
      dayInCents: inputFromCents(listing?.pricing.dayInCents ?? null),
      weekInCents: inputFromCents(listing?.pricing.weekInCents ?? null),
      monthInCents: inputFromCents(listing?.pricing.monthInCents ?? null),
    },
  });

  if (loading)
    return (
      <div className="mx-auto max-w-[1320px] px-4 py-10 sm:px-6">
        <Skeleton className="h-9 w-40 rounded-full" />
        <Skeleton className="mt-6 h-14 w-2/3" />
        <div className="mt-8 grid gap-10 lg:grid-cols-12">
          <Skeleton className="aspect-[16/9] w-full rounded-3xl lg:col-span-8" />
          <Skeleton className="h-96 rounded-3xl lg:col-span-4" />
        </div>
      </div>
    );

  if (error !== null || listing === null)
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center sm:px-6">
        <NoParkingSign className="size-24" />
        <h1 className="mt-8 font-display text-3xl font-bold text-fg">{t('common:error.title')}</h1>
        <p className="mt-3 text-fg-muted">{error ?? t('common:error.unexpected')}</p>
        <Link to="/recherche" className={`${buttonVariants({ variant: 'outline' })} mt-8`}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          {t('common:action.back')}
        </Link>
      </div>
    );

  const periodProblem = problemWithRequestedPeriod({ fromDay, toDay }, todayAsCalendarDay());
  const inWindow = periodProblem === null && isListingAvailableOn(listing, fromDay, toDay);
  const estimate =
    periodProblem === null && inWindow
      ? estimateRentalPriceInCents(listing.pricing, fromDay, toDay)
      : null;
  const canBook = isAuthenticated && periodProblem === null && inWindow && estimate !== null;

  const submitPricing = (values: PricingValues): void => {
    dispatch(
      updateListingPricingRequested({
        id: listing.id,
        pricing: {
          dayInCents: centsFromInput(values.dayInCents),
          weekInCents: centsFromInput(values.weekInCents),
          monthInCents: centsFromInput(values.monthInCents),
        },
      }),
    );
  };

  const nightly = cheapestNightlyRateInCents(listing.pricing);
  const nights = estimate === null ? 0 : dayCountOf(fromDay, toDay);

  return (
    <div className="mx-auto max-w-[1320px] px-4 pt-6 pb-8 sm:px-6">
      <Link to="/recherche" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), '-ml-2')}>
        <ArrowLeft className="size-4" aria-hidden="true" />
        {t('common:action.back')}
      </Link>

      <header className="animate-rise mt-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="accent" className="px-3 py-1.5 font-mono text-[0.8rem]">
            {t('listing:card.box', { box: listing.box })}
          </Badge>
          <Badge tone="neutral" className="px-3 py-1.5 text-[0.8rem]">
            <CalendarRange className="size-3.5" aria-hidden="true" />
            {t('listing:card.availableUntil', { date: formatDay(listing.availability.to) })}
          </Badge>
        </div>
        <h1 className="mt-4 flex items-start gap-3 font-display text-[clamp(2rem,4.6vw,3.5rem)] leading-[1.02] font-bold tracking-[-0.035em] text-fg">
          <MapPin className="mt-[0.2em] size-[0.8em] shrink-0 text-accent" aria-hidden="true" />
          <span className="min-w-0">{listing.address}</span>
        </h1>
      </header>

      <div className="mt-8 grid gap-10 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-7 xl:col-span-8">
          <div className="animate-rise grain relative aspect-[16/9] overflow-hidden rounded-3xl bg-[#161a24] ring-1 ring-line [--i:1]">
            <BayScene box={listing.box} />
          </div>

          {listing.photos.length > 0 && (
            <section className="mt-4">
              <h2 className="sr-only">{t('listing:detail.photos')}</h2>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {listing.photos.map((photo) => (
                  <li
                    key={photo}
                    className="bg-hatch flex aspect-[4/3] flex-col justify-between rounded-2xl border border-line bg-bg-sunken p-3"
                  >
                    <ImageIcon className="size-5 text-fg-subtle" aria-hidden="true" />
                    <span className="truncate font-mono text-[11px] text-fg-muted">{photo}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-fg-subtle">{t('listing:detail.photosHint')}</p>
            </section>
          )}

          <section className="mt-12">
            <h2 className="flex items-center gap-2.5 font-display text-2xl font-bold text-fg">
              {t('listing:detail.availability')}
            </h2>
            <div className="tabular mt-5 flex items-center gap-4 rounded-2xl border border-line bg-bg-raised p-5">
              <span className="font-display text-lg font-semibold text-fg">
                {formatDay(listing.availability.from)}
              </span>
              <span aria-hidden="true" className="relative h-1.5 flex-1 rounded-full bg-bg-sunken">
                <span className="absolute inset-0 rounded-full bg-gradient-to-r from-brand to-signal-400" />
                <span className="absolute top-1/2 left-0 size-3.5 -translate-y-1/2 rounded-full border-[3px] border-bg-raised bg-brand" />
                <span className="absolute top-1/2 right-0 size-3.5 -translate-y-1/2 rounded-full border-[3px] border-bg-raised bg-signal-400" />
              </span>
              <span className="font-display text-lg font-semibold text-fg">
                {formatDay(listing.availability.to)}
              </span>
            </div>
          </section>

          <section className="mt-12">
            <h2 className="font-display text-2xl font-bold text-fg">
              {t('listing:criteria.accepted')}
            </h2>
            <VehicleBadges acceptedVehicles={listing.acceptedVehicles} className="mt-5" />
          </section>

          <section className="mt-12">
            <h2 className="font-display text-2xl font-bold text-fg">
              {t('listing:detail.pricing')}
            </h2>
            <div className="mt-5">
              <PricingGrid pricing={listing.pricing} />
            </div>
          </section>

          {isAuthenticated && (
            <section className="mt-12 rounded-3xl border border-dashed border-line-strong p-6 sm:p-7">
              <h2 className="flex items-center gap-2.5 font-display text-xl font-bold text-fg">
                <span className="grid size-9 place-items-center rounded-xl bg-accent-soft text-accent">
                  <KeyRound className="size-4" aria-hidden="true" />
                </span>
                {t('listing:detail.ownerActions')}
              </h2>
              <p className="mt-2 text-sm text-fg-subtle">{t('listing:detail.ownerHint')}</p>

              {repriced && (
                <Notice tone="success" className="mt-4">
                  {t('listing:pricing.saved')}
                </Notice>
              )}
              {unpublishError !== null && (
                <Notice tone="error" title={t('common:error.title')} className="mt-4">
                  {unpublishError}
                </Notice>
              )}
              {repriceError !== null && (
                <Notice tone="error" title={t('common:error.title')} className="mt-4">
                  {repriceError}
                </Notice>
              )}

              <div className="mt-5 flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  aria-expanded={editingPricing}
                  onClick={() => setEditingPricing((open) => !open)}
                >
                  <PencilLine className="size-4" aria-hidden="true" />
                  {t('listing:detail.editPricing')}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  disabled={unpublishing}
                  onClick={() => dispatch(unpublishListingRequested({ id: listing.id }))}
                >
                  {unpublishing ? <Spinner /> : <Trash2 className="size-4" aria-hidden="true" />}
                  {t('listing:detail.unpublish')}
                </Button>
              </div>

              {editingPricing && (
                <form
                  onSubmit={(event) => void form.handleSubmit(submitPricing)(event)}
                  className="animate-rise mt-5 grid gap-4 rounded-2xl border border-line bg-bg-raised p-5 sm:grid-cols-3"
                >
                  {(['dayInCents', 'weekInCents', 'monthInCents'] as const).map((name) => (
                    <Field
                      key={name}
                      label={t(`listing:pricing.${name.replace('InCents', '')}`)}
                      error={form.formState.errors[name]?.message}
                    >
                      {({ id, describedBy, invalid }) => (
                        <Input
                          id={id}
                          aria-describedby={describedBy}
                          aria-invalid={invalid}
                          inputMode="decimal"
                          placeholder="—"
                          {...form.register(name)}
                        />
                      )}
                    </Field>
                  ))}
                  <div className="sm:col-span-3">
                    <Button type="submit" size="sm" disabled={repricing}>
                      {repricing && <Spinner />}
                      {t('listing:pricing.save')}
                    </Button>
                  </div>
                </form>
              )}
            </section>
          )}
        </div>

        <aside className="lg:col-span-5 xl:col-span-4">
          <div className="animate-rise sticky top-24 rounded-3xl border border-line bg-bg-raised p-6 shadow-[var(--shadow-lift)] [--i:2] sm:p-7">
            {nightly !== null && (
              <p className="tabular flex items-baseline gap-1.5">
                <span className="text-sm text-fg-subtle">{t('listing:card.from')}</span>
                <span className="font-display text-4xl font-extrabold tracking-[-0.04em] text-fg">
                  {formatCents(nightly)}
                </span>
                <span className="text-sm text-fg-subtle">{t('common:unit.perNight')}</span>
              </p>
            )}
            <h2
              className={cn(
                'font-display text-xl font-semibold text-fg',
                nightly !== null && 'mt-4 border-t border-line pt-4 text-base text-fg-muted',
              )}
            >
              {t('rental:book.title')}
            </h2>

            {paymentAbandoned && !booked && (
              <Notice tone="info" className="mt-4">
                {t('rental:book.abandoned')}
              </Notice>
            )}

            {booked ? (
              <Notice tone="success" title={t('rental:book.requested')} className="mt-5">
                {t('rental:book.requestedBody')}
              </Notice>
            ) : (
              <>
                {/* Les deux dates dans un même cadre, comme sur un billet :
                    arrivée à gauche, départ à droite, un calendrier pour les deux. */}
                <div className="mt-4">
                  {/* Le calendrier n'offre que les jours où la place est ouverte :
                      `isListingAvailableOn` tranche toujours, mais un jour qu'on
                      ne peut pas réserver n'a pas à être cliquable. */}
                  <DateRangeField
                    variant="joined"
                    placement="side"
                    months={2}
                    labels={{ from: t('rental:book.from'), to: t('rental:book.to') }}
                    value={{ from: fromDay, to: toDay }}
                    onChange={(period) => {
                      setFromDay(period.from);
                      setToDay(period.to);
                    }}
                    min={laterDay(todayAsCalendarDay(), listing.availability.from.slice(0, 10))}
                    max={listing.availability.to.slice(0, 10)}
                  />
                </div>

                {periodProblem !== null && periodProblem !== 'incomplete' && (
                  <Notice tone="error" className="mt-4">
                    {t(`rental:validation.${periodProblem}`)}
                  </Notice>
                )}

                {periodProblem === null && !inWindow && (
                  <Notice tone="error" className="mt-4">
                    {t('rental:book.outOfRange')}
                  </Notice>
                )}

                {periodProblem === null && inWindow && estimate === null && (
                  <Notice tone="error" className="mt-4">
                    {t('rental:book.noPrice')}
                  </Notice>
                )}

                {estimate !== null && (
                  <div className="animate-rise mt-4 rounded-2xl bg-bg-sunken p-4">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm font-medium text-fg-muted">
                        {t('rental:book.estimate')}
                      </span>
                      <span className="tabular font-display text-4xl font-extrabold tracking-[-0.04em] text-fg">
                        {formatCents(estimate)}
                      </span>
                    </div>
                    <p className="tabular mt-1 text-right text-xs font-medium text-fg-muted">
                      {t('common:unit.night', { count: nights })}
                    </p>
                    <p className="mt-3 border-t border-line pt-3 text-xs text-fg-subtle">
                      {t('rental:book.estimateHint')}
                    </p>
                  </div>
                )}

                {bookingError !== null && (
                  <Notice tone="error" title={t('common:error.title')} className="mt-4">
                    {bookingError}
                  </Notice>
                )}

                {isAuthenticated ? (
                  <Button
                    block
                    size="lg"
                    className="mt-5"
                    disabled={!canBook || booking}
                    onClick={() =>
                      dispatch(
                        requestRentalRequested({
                          address: listing.address,
                          box: listing.box,
                          fromDay,
                          toDay,
                        }),
                      )
                    }
                  >
                    {booking && <Spinner />}
                    {t('rental:book.submit')}
                  </Button>
                ) : (
                  <Link
                    to="/connexion"
                    className={`${buttonVariants({ variant: 'primary', size: 'lg', block: true })} mt-5`}
                  >
                    {t('rental:book.signInFirst')}
                  </Link>
                )}
              </>
            )}

            <section className="mt-6 border-t border-dashed border-line-strong pt-5">
              <h3 className="label-ticket flex items-center gap-2 text-fg-subtle">
                <KeyRound className="size-3.5" aria-hidden="true" />
                {t('listing:detail.access')}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-fg-muted">
                {t('listing:field.accessHint')}
              </p>
            </section>
          </div>
        </aside>
      </div>
    </div>
  );
};
