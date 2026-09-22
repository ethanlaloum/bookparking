import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Clock3, Euro, LogOut, Moon, SquareParking } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import {
  changePasswordRequested,
  resetChangePasswordState,
} from '../app/account/domain/use-cases/change-password/changePasswordEpic';
import { logoutRequested } from '../app/auth/domain/use-cases/sign-out/signOutEpic';
import { listOwnerListingsRequested } from '../app/listing/domain/use-cases/list-owner-listings/listOwnerListingsEpic';
import { rentedNightCount } from '../app/rental/domain/entities/RentalRequestView';
import { confirmRentalRequestRequested } from '../app/rental/domain/use-cases/confirm-rental-request/confirmRentalRequestEpic';
import { listMyRentalRequestsRequested } from '../app/rental/domain/use-cases/list-my-rental-requests/listMyRentalRequestsEpic';
import { listReceivedRentalRequestsRequested } from '../app/rental/domain/use-cases/list-received-rental-requests/listReceivedRentalRequestsEpic';
import { EmptyState } from '../components/EmptyState';
import { MetricTile } from '../components/MetricTile';
import { Notice } from '../components/Notice';
import { OwnerListingRow } from '../components/OwnerListingRow';
import { RentalRequestRow } from '../components/RentalRequestRow';
import { Button } from '../components/ui/button';
import { buttonVariants } from '../components/ui/buttonVariants';
import { Card } from '../components/ui/card';
import { Field } from '../components/ui/field';
import { Input } from '../components/ui/input';
import { Skeleton } from '../components/ui/skeleton';
import { Spinner } from '../components/ui/spinner';
import { cn } from '../lib/cn';
import { formatCents, formatDay } from '../lib/format';
import {
  selectChangePasswordError,
  selectChangePasswordLoading,
  selectChangePasswordSuccess,
} from '../selectors/account/accountSelectors';
import { selectSession } from '../selectors/auth/authSelectors';
import {
  selectActiveOwnerListings,
  selectOwnerListings,
  selectOwnerListingsError,
  selectOwnerListingsLoading,
} from '../selectors/listing/listingSelectors';
import {
  selectConfirmRentalError,
  selectConfirmRentalLoading,
  selectConfirmedRevenueInCents,
  selectPendingRevenueInCents,
  selectReceivedRentalRequests,
  selectReceivedRentalRequestsError,
  selectReceivedRentalRequestsLoading,
  selectSortedMyRequests,
  selectSortedReceivedRequests,
} from '../selectors/rental/rentalSelectors';
import { useAppDispatch, useAppSelector } from '../store/redux';
import { changePasswordSchema, type ChangePasswordValues } from './changePasswordSchema';

const TABS = ['overview', 'places', 'received', 'mine', 'settings'] as const;
type Tab = (typeof TABS)[number];

export const AccountPage = () => {
  const { t } = useTranslation(['account', 'common', 'listing']);
  const dispatch = useAppDispatch();
  const [tab, setTab] = useState<Tab>('overview');

  const session = useAppSelector(selectSession);
  const ownerListings = useAppSelector(selectOwnerListings);
  const activeListings = useAppSelector(selectActiveOwnerListings);
  const listingsLoading = useAppSelector(selectOwnerListingsLoading);
  const listingsError = useAppSelector(selectOwnerListingsError);

  const received = useAppSelector(selectSortedReceivedRequests);
  const receivedRaw = useAppSelector(selectReceivedRentalRequests);
  const receivedLoading = useAppSelector(selectReceivedRentalRequestsLoading);
  const receivedError = useAppSelector(selectReceivedRentalRequestsError);
  const mine = useAppSelector(selectSortedMyRequests);

  const revenue = useAppSelector(selectConfirmedRevenueInCents);
  const pendingRevenue = useAppSelector(selectPendingRevenueInCents);
  const confirming = useAppSelector(selectConfirmRentalLoading);
  const confirmError = useAppSelector(selectConfirmRentalError);

  const passwordLoading = useAppSelector(selectChangePasswordLoading);
  const passwordError = useAppSelector(selectChangePasswordError);
  const passwordSuccess = useAppSelector(selectChangePasswordSuccess);

  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '' },
  });

  useEffect(() => {
    dispatch(listOwnerListingsRequested());
    dispatch(listReceivedRentalRequestsRequested());
    dispatch(listMyRentalRequestsRequested());
  }, [dispatch]);

  useEffect(() => {
    if (passwordSuccess) form.reset();
  }, [form, passwordSuccess]);

  useEffect(() => () => void dispatch(resetChangePasswordState()), [dispatch]);

  const confirmedNights = receivedRaw
    .filter((request) => request.status === 'CONFIRMED')
    .reduce((total, request) => total + rentedNightCount(request), 0);

  const anyError = listingsError ?? receivedError;

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-10 sm:px-6">
      <h1 className="font-display text-[clamp(1.75rem,4vw,2.5rem)] font-bold text-fg">
        {t('account:dashboard.title')}
      </h1>
      <p className="mt-2 text-fg-muted">{t('account:dashboard.subtitle')}</p>

      <div role="tablist" aria-label={t('account:dashboard.title')} className="mt-8 flex flex-wrap gap-1 border-b border-line">
        {TABS.map((name) => (
          <button
            key={name}
            role="tab"
            type="button"
            aria-selected={tab === name}
            onClick={() => setTab(name)}
            className={cn(
              'cursor-pointer rounded-t-[2px] border-b-2 px-4 py-2.5 text-sm font-medium transition-colors duration-150',
              tab === name
                ? 'border-accent text-fg'
                : 'border-transparent text-fg-subtle hover:text-fg',
            )}
          >
            {t(`account:dashboard.tab.${name}`)}
          </button>
        ))}
      </div>

      {anyError !== null && (
        <Notice tone="error" title={t('common:error.title')} className="mt-6">
          {anyError}
        </Notice>
      )}

      {tab === 'overview' && (
        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {listingsLoading || receivedLoading ? (
            [0, 1, 2, 3].map((slot) => <Skeleton key={slot} className="h-32" />)
          ) : (
            <>
              <MetricTile
                accent
                icon={Euro}
                label={t('account:metric.revenue')}
                value={formatCents(revenue)}
                hint={t('account:metric.revenueHint')}
              />
              <MetricTile
                icon={Clock3}
                label={t('account:metric.pending')}
                value={formatCents(pendingRevenue)}
                hint={t('account:metric.pendingHint')}
              />
              <MetricTile
                icon={SquareParking}
                label={t('account:metric.places')}
                value={String(activeListings.length)}
                hint={t('account:metric.placesHint')}
              />
              <MetricTile
                icon={Moon}
                label={t('account:metric.nights')}
                value={String(confirmedNights)}
                hint={t('account:metric.nightsHint')}
              />
            </>
          )}
        </section>
      )}

      {tab === 'places' && (
        <section className="mt-8">
          {listingsLoading && <Skeleton className="h-40" />}
          {!listingsLoading && ownerListings.length === 0 && (
            <EmptyState
              title={t('account:places.empty')}
              action={
                <Link to="/publier" className={buttonVariants({ variant: 'primary', size: 'sm' })}>
                  {t('account:places.emptyAction')}
                </Link>
              }
            />
          )}
          {ownerListings.length > 0 && (
            <Card className="px-5">
              <ul>
                {ownerListings.map((listing) => (
                  <OwnerListingRow key={listing.id} listing={listing} />
                ))}
              </ul>
            </Card>
          )}
        </section>
      )}

      {tab === 'received' && (
        <section className="mt-8">
          <p className="mb-4 text-sm text-fg-subtle">{t('account:received.hint')}</p>
          {confirmError !== null && (
            <Notice tone="error" title={t('common:error.title')} className="mb-4">
              {confirmError}
            </Notice>
          )}
          {receivedLoading && <Skeleton className="h-40" />}
          {!receivedLoading && received.length === 0 && (
            <EmptyState title={t('account:received.empty')} />
          )}
          {received.length > 0 && (
            <Card className="px-5">
              <ul>
                {received.map((request) => (
                  <RentalRequestRow
                    key={request.id}
                    request={request}
                    action={
                      request.status === 'PENDING' ? (
                        <Button
                          size="sm"
                          disabled={confirming}
                          onClick={() =>
                            dispatch(confirmRentalRequestRequested({ requestId: request.id }))
                          }
                        >
                          {confirming && <Spinner />}
                          <CheckCircle2 className="size-4" aria-hidden="true" />
                          {t('account:received.confirm')}
                        </Button>
                      ) : undefined
                    }
                  />
                ))}
              </ul>
            </Card>
          )}
        </section>
      )}

      {tab === 'mine' && (
        <section className="mt-8">
          {mine.length === 0 ? (
            <EmptyState
              title={t('account:mine.empty')}
              action={
                <Link to="/" className={buttonVariants({ variant: 'primary', size: 'sm' })}>
                  {t('account:mine.emptyAction')}
                </Link>
              }
            />
          ) : (
            <Card className="px-5">
              <ul>
                {mine.map((request) => (
                  <RentalRequestRow key={request.id} request={request} />
                ))}
              </ul>
            </Card>
          )}
        </section>
      )}

      {tab === 'settings' && (
        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <h2 className="font-display text-lg font-semibold text-fg">
              {t('account:session.title')}
            </h2>
            {session !== null && (
              <p className="tabular mt-2 text-sm text-fg-muted">
                {t('account:session.validUntil', { date: formatDay(session.validUntil) })}
              </p>
            )}
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => dispatch(logoutRequested())}
            >
              <LogOut className="size-4" aria-hidden="true" />
              {t('account:session.signOut')}
            </Button>
          </Card>

          <Card className="p-6">
            <h2 className="font-display text-lg font-semibold text-fg">
              {t('account:password.title')}
            </h2>
            <form
              noValidate
              onSubmit={(event) =>
                void form.handleSubmit((values) => dispatch(changePasswordRequested(values)))(event)
              }
              className="mt-5 flex flex-col gap-4"
            >
              {passwordError !== null && (
                <Notice tone="error" title={t('common:error.title')}>
                  {passwordError}
                </Notice>
              )}
              {passwordSuccess && <Notice tone="success">{t('account:password.changed')}</Notice>}

              <Field
                label={t('account:password.current')}
                error={form.formState.errors.currentPassword?.message}
              >
                {({ id, describedBy, invalid }) => (
                  <Input
                    id={id}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    type="password"
                    autoComplete="current-password"
                    {...form.register('currentPassword')}
                  />
                )}
              </Field>

              <Field
                label={t('account:password.next')}
                hint={t('account:password.hint')}
                error={form.formState.errors.newPassword?.message}
              >
                {({ id, describedBy, invalid }) => (
                  <Input
                    id={id}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    type="password"
                    autoComplete="new-password"
                    {...form.register('newPassword')}
                  />
                )}
              </Field>

              <Button type="submit" disabled={passwordLoading} className="mt-1 self-start">
                {passwordLoading && <Spinner />}
                {t('account:password.submit')}
              </Button>
            </form>
          </Card>
        </section>
      )}
    </div>
  );
};
