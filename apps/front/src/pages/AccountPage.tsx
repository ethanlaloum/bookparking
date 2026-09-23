import { zodResolver } from '@hookform/resolvers/zod';
import {
  CheckCircle2,
  Clock3,
  Euro,
  LogOut,
  Moon,
  ShieldCheck,
  SquareParking,
} from 'lucide-react';
import { lazy, Suspense, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import {
  changePasswordRequested,
  resetChangePasswordState,
} from '../app/account/domain/use-cases/change-password/changePasswordEpic';
import { logoutRequested } from '../app/auth/domain/use-cases/sign-out/signOutEpic';
import { confirmAdminAccessRequested } from '../app/back-office/domain/use-cases/confirm-admin-access/confirmAdminAccessEpic';
import { listOwnerListingsRequested } from '../app/listing/domain/use-cases/list-owner-listings/listOwnerListingsEpic';
import { rentedNightCount } from '../app/rental/domain/entities/RentalRequestView';
import { confirmRentalRequestRequested } from '../app/rental/domain/use-cases/confirm-rental-request/confirmRentalRequestEpic';
import { listMyRentalRequestsRequested } from '../app/rental/domain/use-cases/list-my-rental-requests/listMyRentalRequestsEpic';
import { listReceivedRentalRequestsRequested } from '../app/rental/domain/use-cases/list-received-rental-requests/listReceivedRentalRequestsEpic';
import { EmptyState } from '../components/EmptyState';
import { Loader } from '../components/Loader';
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
import { selectAdminAccess } from '../selectors/back-office/backOfficeSelectors';
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

const PERSONAL_TABS = ['overview', 'places', 'received', 'mine', 'settings'] as const;

// Les quatre onglets d'administration ne sont montés que pour un compte dont
// `GET /admin/access` a répondu 204 — et leur code n'est téléchargé qu'à ce
// moment-là : `lazy` en fait des fragments à part, qui ne pèsent pas sur le
// chargement du site public.
const ADMIN_TABS = ['admin-overview', 'admin-accounts', 'admin-listings', 'admin-requests'] as const;

type PersonalTab = (typeof PERSONAL_TABS)[number];
type AdminTab = (typeof ADMIN_TABS)[number];
type Tab = PersonalTab | AdminTab;

const ADMIN_TAB_LABEL: Record<AdminTab, string> = {
  'admin-overview': 'overview',
  'admin-accounts': 'accounts',
  'admin-listings': 'listings',
  'admin-requests': 'requests',
};

const AdminOverviewPanel = lazy(async () => ({
  default: (await import('./admin/AdminOverviewPanel')).AdminOverviewPanel,
}));
const AdminAccountsPanel = lazy(async () => ({
  default: (await import('./admin/AdminAccountsPanel')).AdminAccountsPanel,
}));
const AdminListingsPanel = lazy(async () => ({
  default: (await import('./admin/AdminListingsPanel')).AdminListingsPanel,
}));
const AdminRequestsPanel = lazy(async () => ({
  default: (await import('./admin/AdminRequestsPanel')).AdminRequestsPanel,
}));

const TAB_CLASS =
  'inline-flex min-h-10 cursor-pointer items-center rounded-xl px-4 text-sm font-medium whitespace-nowrap transition-[background-color,color,box-shadow] duration-200';

export const AccountPage = () => {
  const { t } = useTranslation(['account', 'common', 'listing', 'admin']);
  const dispatch = useAppDispatch();
  const [tab, setTab] = useState<Tab>('overview');

  const session = useAppSelector(selectSession);
  const isAdmin = useAppSelector(selectAdminAccess) === 'granted';
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
    // La sonde d'administration part avec les trois lectures du tableau de
    // bord : un 403 ne coûte rien, et c'est le seul moyen de savoir si ce
    // compte administre le site.
    dispatch(confirmAdminAccessRequested());
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
    <div className="mx-auto max-w-[1320px] px-4 pt-8 pb-4 sm:px-6">
      <div className="animate-rise flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-[clamp(2.25rem,4.5vw,3.5rem)] leading-none font-bold tracking-[-0.035em] text-fg">
            {t('account:dashboard.title')}
          </h1>
          <p className="mt-3 text-lg text-fg-muted">{t('account:dashboard.subtitle')}</p>
        </div>
        {session !== null && (
          <p className="label-ticket tabular inline-flex items-center gap-2 self-start rounded-full border border-line bg-bg-raised px-3 py-2 text-fg-subtle sm:self-auto">
            <span className="size-1.5 rounded-full bg-ok" aria-hidden="true" />
            {t('account:session.validUntil', { date: formatDay(session.validUntil) })}
          </p>
        )}
      </div>

      {/* Deux listes d'onglets, et non une seule coupée par une étiquette : un
          `role="tablist"` n'admet que des onglets pour enfants, et le groupe
          d'administration mérite son propre nom accessible. */}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <div
          role="tablist"
          aria-label={t('account:dashboard.title')}
          className="flex flex-wrap gap-1 rounded-2xl bg-bg-sunken p-1 ring-1 ring-line ring-inset"
        >
          {PERSONAL_TABS.map((name) => (
            <button
              key={name}
              role="tab"
              type="button"
              aria-selected={tab === name}
              onClick={() => setTab(name)}
              className={cn(
                TAB_CLASS,
                tab === name
                  ? 'bg-bg-raised font-semibold text-fg shadow-[var(--shadow-panel)] ring-1 ring-line-strong'
                  : 'text-fg-muted hover:text-fg',
              )}
            >
              {t(`account:dashboard.tab.${name}`)}
            </button>
          ))}
        </div>

        {isAdmin && (
          <div className="flex flex-wrap items-center gap-1 rounded-2xl bg-warn-bg/60 p-1 ring-1 ring-warn/25 ring-inset">
            <span
              id="groupe-administration"
              className="label-ticket inline-flex items-center gap-1.5 px-3 text-warn"
            >
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              {t('admin:group')}
            </span>
            <div
              role="tablist"
              aria-labelledby="groupe-administration"
              className="flex flex-wrap gap-1"
            >
              {ADMIN_TABS.map((name) => (
                <button
                  key={name}
                  role="tab"
                  type="button"
                  aria-selected={tab === name}
                  onClick={() => setTab(name)}
                  className={cn(
                    TAB_CLASS,
                    tab === name
                      ? 'bg-bg-raised text-fg shadow-[var(--shadow-panel)] ring-1 ring-warn/40'
                      : 'text-warn hover:text-fg',
                  )}
                >
                  {t(`admin:tab.${ADMIN_TAB_LABEL[name]}`)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {isAdmin && tab.startsWith('admin-') && (
        <section className="mt-8">
          <p className="mb-6 rounded-xl border border-warn/30 bg-warn-bg px-3.5 py-2.5 text-center text-xs font-medium text-warn">
            {t('admin:banner')}
          </p>
          <Suspense fallback={<Loader />}>
            {tab === 'admin-overview' && <AdminOverviewPanel />}
            {tab === 'admin-accounts' && <AdminAccountsPanel />}
            {tab === 'admin-listings' && <AdminListingsPanel />}
            {tab === 'admin-requests' && <AdminRequestsPanel />}
          </Suspense>
        </section>
      )}

      {anyError !== null && (
        <Notice tone="error" title={t('common:error.title')} className="mt-6">
          {anyError}
        </Notice>
      )}

      {tab === 'overview' && (
        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {listingsLoading || receivedLoading ? (
            [0, 1, 2, 3].map((slot) => <Skeleton key={slot} className="h-44" />)
          ) : (
            <>
              <MetricTile
                tone="accent"
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
            <Card className="overflow-hidden">
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
          <Notice tone="info" className="mb-4">
            {t('account:received.hint')}
          </Notice>
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
            <Card className="overflow-hidden">
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
                <Link to="/recherche" className={buttonVariants({ variant: 'primary', size: 'sm' })}>
                  {t('account:mine.emptyAction')}
                </Link>
              }
            />
          ) : (
            <Card className="overflow-hidden">
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
          <Card className="p-6 sm:p-7">
            <h2 className="font-display text-xl font-bold text-fg">
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

          <Card className="p-6 sm:p-7">
            <h2 className="font-display text-xl font-bold text-fg">
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
