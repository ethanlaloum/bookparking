import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarRange, KeyRound, MapPin, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';

import {
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
import { Notice } from '../components/Notice';
import { PricingGrid } from '../components/PricingGrid';
import { VehicleBadges } from '../components/VehicleBadges';
import { Button } from '../components/ui/button';
import { buttonVariants } from '../components/ui/buttonVariants';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';
import { Field } from '../components/ui/field';
import { Input } from '../components/ui/input';
import { Skeleton } from '../components/ui/skeleton';
import { Spinner } from '../components/ui/spinner';
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

export const ListingDetailPage = () => {
  const { id = '' } = useParams<{ id: string }>();
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
      <div className="mx-auto max-w-[1240px] px-4 py-12 sm:px-6">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="mt-6 aspect-[21/9] w-full" />
      </div>
    );

  if (error !== null || listing === null)
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        <h1 className="font-display text-2xl font-semibold text-fg">{t('common:error.title')}</h1>
        <p className="mt-3 text-fg-muted">{error ?? t('common:error.unexpected')}</p>
        <Link to="/" className={`${buttonVariants({ variant: 'outline' })} mt-7`}>
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

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-10 sm:px-6">
      <Link to="/" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
        ← {t('common:action.back')}
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Badge tone="accent" className="font-display">
            {t('listing:card.box', { box: listing.box })}
          </Badge>
          <h1 className="mt-3 flex items-start gap-2.5 font-display text-[clamp(1.75rem,4vw,2.75rem)] leading-[1.1] font-bold text-fg">
            <MapPin className="mt-1.5 size-6 shrink-0 text-accent" aria-hidden="true" />
            <span className="min-w-0">{listing.address}</span>
          </h1>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {listing.photos.map((photo) => (
              <div
                key={photo}
                className="bg-hatch flex aspect-[4/3] items-end border border-line bg-bg-sunken p-2"
              >
                <span className="truncate rounded-[2px] bg-bg-raised/92 px-1.5 py-1 text-[11px] text-fg-subtle">
                  {photo}
                </span>
              </div>
            ))}
          </div>

          <section className="mt-10">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-fg">
              <CalendarRange className="size-4 text-accent" aria-hidden="true" />
              {t('listing:detail.availability')}
            </h2>
            <p className="tabular mt-2 text-fg-muted">
              {formatDay(listing.availability.from)} → {formatDay(listing.availability.to)}
            </p>
          </section>

          <section className="mt-8">
            <h2 className="font-display text-lg font-semibold text-fg">
              {t('listing:criteria.accepted')}
            </h2>
            <VehicleBadges acceptedVehicles={listing.acceptedVehicles} className="mt-3" />
          </section>

          <section className="mt-8">
            <h2 className="font-display text-lg font-semibold text-fg">
              {t('listing:detail.pricing')}
            </h2>
            <div className="mt-3">
              <PricingGrid pricing={listing.pricing} />
            </div>
          </section>

          {isAuthenticated && (
            <section className="mt-10 border-t border-line pt-8">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-fg">
                <KeyRound className="size-4 text-accent" aria-hidden="true" />
                {t('listing:detail.ownerActions')}
              </h2>
              <p className="mt-1.5 text-sm text-fg-subtle">{t('listing:detail.ownerHint')}</p>

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

              <div className="mt-4 flex flex-wrap gap-3">
                <Button variant="outline" size="sm" onClick={() => setEditingPricing((open) => !open)}>
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
                  className="mt-5 grid gap-4 border border-line bg-bg-raised p-5 sm:grid-cols-3"
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

        <aside className="lg:col-span-5">
          <Card className="sticky top-24 p-6">
            <h2 className="font-display text-xl font-semibold text-fg">{t('rental:book.title')}</h2>

            {booked ? (
              <Notice tone="success" title={t('rental:book.requested')} className="mt-5">
                {t('rental:book.requestedBody')}
              </Notice>
            ) : (
              <>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <Field label={t('rental:book.from')}>
                    {({ id, describedBy }) => (
                      <Input
                        id={id}
                        aria-describedby={describedBy}
                        type="date"
                        min={todayAsCalendarDay()}
                        value={fromDay}
                        onChange={(event) => setFromDay(event.target.value)}
                      />
                    )}
                  </Field>
                  <Field label={t('rental:book.to')}>
                    {({ id, describedBy }) => (
                      <Input
                        id={id}
                        aria-describedby={describedBy}
                        type="date"
                        min={fromDay === '' ? todayAsCalendarDay() : fromDay}
                        value={toDay}
                        onChange={(event) => setToDay(event.target.value)}
                      />
                    )}
                  </Field>
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
                  <div className="mt-5 border-t border-line pt-5">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm text-fg-muted">{t('rental:book.estimate')}</span>
                      <span className="tabular font-display text-3xl font-bold text-fg">
                        {formatCents(estimate)}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-fg-subtle">{t('rental:book.estimateHint')}</p>
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

            <section className="mt-6 border-t border-line pt-5">
              <h3 className="text-xs font-semibold tracking-wide text-fg-subtle uppercase">
                {t('listing:detail.access')}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-fg-muted">
                {t('listing:field.accessHint')}
              </p>
            </section>
          </Card>
        </aside>
      </div>
    </div>
  );
};
