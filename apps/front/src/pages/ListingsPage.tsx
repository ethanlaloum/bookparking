import { Search, SlidersHorizontal } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { listListingsRequested } from '../app/listing/domain/use-cases/list-listings/listListingsEpic';
import { EmptyState } from '../components/EmptyState';
import { ListingCard } from '../components/ListingCard';
import { Notice } from '../components/Notice';
import { ParkingMark } from '../components/ParkingMark';
import { Button } from '../components/ui/button';
import { buttonVariants } from '../components/ui/buttonVariants';
import { Field } from '../components/ui/field';
import { Input } from '../components/ui/input';
import { Skeleton } from '../components/ui/skeleton';
import { formatCents, todayAsCalendarDay } from '../lib/format';
import {
  selectCheapestRateInCents,
  selectListings,
  selectListingsError,
  selectListingsLoaded,
  selectListingsLoading,
  selectMatchingListings,
} from '../selectors/listing/listingSelectors';
import { selectIsAuthenticated } from '../selectors/auth/authSelectors';
import { useAppDispatch, useAppSelector } from '../store/redux';

export const ListingsPage = () => {
  const { t } = useTranslation(['listing', 'common']);
  const dispatch = useAppDispatch();

  const [query, setQuery] = useState('');
  const [fromDay, setFromDay] = useState('');
  const [toDay, setToDay] = useState('');

  const filters = useMemo(() => ({ query, fromDay, toDay }), [query, fromDay, toDay]);

  const listings = useAppSelector(selectListings);
  const matching = useAppSelector((state) => selectMatchingListings(state, filters));
  const loading = useAppSelector(selectListingsLoading);
  const loaded = useAppSelector(selectListingsLoaded);
  const error = useAppSelector(selectListingsError);
  const cheapest = useAppSelector(selectCheapestRateInCents);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  useEffect(() => {
    if (!loaded && !loading) dispatch(listListingsRequested());
  }, [dispatch, loaded, loading]);

  const filtersActive = query !== '' || fromDay !== '' || toDay !== '';

  return (
    <>
      <section className="border-b border-line bg-bg-raised">
        <div className="mx-auto grid max-w-[1240px] gap-10 px-4 py-14 sm:px-6 lg:grid-cols-12 lg:py-20">
          <div className="lg:col-span-7">
            <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-accent uppercase">
              <ParkingMark className="size-4" />
              {t('common:brand')}
            </p>
            <h1 className="mt-5 font-display text-[clamp(2.25rem,5.5vw,4rem)] leading-[1.03] font-bold text-fg">
              {t('common:tagline')}
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-fg-muted">
              {t('listing:publish.subtitle')}
            </p>
            {cheapest !== null && (
              <p className="tabular mt-7 flex items-baseline gap-2 text-fg-muted">
                <span className="text-xs tracking-wide uppercase">{t('listing:card.from')}</span>
                <span className="font-display text-3xl font-bold text-fg">
                  {formatCents(cheapest)}
                </span>
                <span className="text-sm">{t('common:unit.perNight')}</span>
              </p>
            )}
          </div>

          <div className="lg:col-span-5 lg:pl-6">
            <div className="rounded-[2px] border border-line-strong bg-bg p-5 shadow-[var(--shadow-panel)]">
              <p className="flex items-center gap-2 font-display text-sm font-semibold text-fg">
                <SlidersHorizontal className="size-4 text-accent" aria-hidden="true" />
                {t('listing:search.panel')}
              </p>
              <div className="mt-4 flex flex-col gap-4">
                <Field label={t('listing:search.label')}>
                  {({ id, describedBy }) => (
                    <div className="relative">
                      <Search
                        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-subtle"
                        aria-hidden="true"
                      />
                      <Input
                        id={id}
                        aria-describedby={describedBy}
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder={t('listing:search.placeholder')}
                        className="pl-9"
                      />
                    </div>
                  )}
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label={t('listing:search.from')}>
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
                  <Field label={t('listing:search.to')}>
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

                {filtersActive && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setQuery('');
                      setFromDay('');
                      setToDay('');
                    }}
                  >
                    {t('listing:search.clear')}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-4 py-12 sm:px-6">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-display text-2xl font-semibold text-fg">{t('listing:list.title')}</h2>
          {loaded && (
            <p className="tabular text-sm text-fg-subtle">
              {t('listing:list.count', { count: matching.length })}
            </p>
          )}
        </div>

        {error !== null && (
          <Notice tone="error" title={t('common:error.title')} className="mt-6">
            {error}
          </Notice>
        )}

        {loading && (
          <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((slot) => (
              <li key={slot}>
                <Skeleton className="aspect-[4/3] w-full" />
                <Skeleton className="mt-3 h-5 w-3/4" />
                <Skeleton className="mt-2 h-4 w-1/2" />
              </li>
            ))}
          </ul>
        )}

        {loaded && matching.length > 0 && (
          <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {matching.map((listing, index) => (
              <ListingCard key={listing.id} listing={listing} index={index} />
            ))}
          </ul>
        )}

        {loaded && matching.length === 0 && (
          <div className="mt-6">
            <EmptyState
              title={listings.length === 0 ? t('listing:list.emptyAll') : t('listing:list.empty')}
              action={
                listings.length === 0 && isAuthenticated ? (
                  <Link to="/publier" className={buttonVariants({ variant: 'primary', size: 'sm' })}>
                    {t('listing:list.emptyAction')}
                  </Link>
                ) : undefined
              }
            />
          </div>
        )}
      </section>
    </>
  );
};
