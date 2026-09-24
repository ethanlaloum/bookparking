import { router, useFocusEffect } from 'expo-router';
import { CircleCheck, Clock3, Euro, LogOut, Moon, Plus, ShieldCheck, SquareParking } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isAcceptablePassword } from '@front/app/account/domain/entities/Account';
import {
  changePasswordRequested,
  resetChangePasswordState,
} from '@front/app/account/domain/use-cases/change-password/changePasswordEpic';
import { logoutRequested } from '@front/app/auth/domain/use-cases/sign-out/signOutEpic';
import { confirmAdminAccessRequested } from '@front/app/back-office/domain/use-cases/confirm-admin-access/confirmAdminAccessEpic';
import { listOwnerListingsRequested } from '@front/app/listing/domain/use-cases/list-owner-listings/listOwnerListingsEpic';
import { rentedNightCount } from '@front/app/rental/domain/entities/RentalRequestView';
import { confirmRentalRequestRequested } from '@front/app/rental/domain/use-cases/confirm-rental-request/confirmRentalRequestEpic';
import { listReceivedRentalRequestsRequested } from '@front/app/rental/domain/use-cases/list-received-rental-requests/listReceivedRentalRequestsEpic';
import { formatCents, formatDay } from '@front/lib/format';
import {
  selectChangePasswordError,
  selectChangePasswordLoading,
  selectChangePasswordSuccess,
} from '@front/selectors/account/accountSelectors';
import { selectIsAuthenticated, selectSession } from '@front/selectors/auth/authSelectors';
import { selectAdminAccess } from '@front/selectors/back-office/backOfficeSelectors';
import {
  selectActiveOwnerListings,
  selectOwnerListings,
  selectOwnerListingsError,
  selectOwnerListingsLoading,
} from '@front/selectors/listing/listingSelectors';
import {
  selectCancelRentalError,
  selectCancelRentalLoading,
  selectConfirmRentalError,
  selectConfirmRentalLoading,
  selectConfirmedRevenueInCents,
  selectPendingRevenueInCents,
  selectReceivedCountByStatus,
  selectReceivedRentalRequests,
  selectReceivedRentalRequestsError,
  selectReceivedRentalRequestsLoading,
  selectSortedReceivedRequests,
} from '@front/selectors/rental/rentalSelectors';

import { ApiUnreachable } from '../../components/ApiUnreachable';
import { MetricTile } from '../../components/MetricTile';
import { OwnerListingRow, RentalRequestRow, RowList } from '../../components/RequestRows';
import { SignInGate } from '../../components/SignInGate';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Field } from '../../components/ui/Field';
import { EmptyState, Rise, Skeleton, useTabBarSpace } from '../../components/ui/Layout';
import { Notice } from '../../components/ui/Notice';
import { Segmented } from '../../components/ui/Segmented';
import { Display, Text, Ticket } from '../../components/ui/Text';
import { useCancelRental } from '../../lib/useCancelRental';
import { useAppDispatch, useAppSelector } from '../../store/redux';
import { useTheme } from '../../theme/useTheme';

const TABS = ['overview', 'places', 'received', 'settings'] as const;
type Tab = (typeof TABS)[number];

/**
 * Le tableau de bord du site, moins « Mes réservations » (devenu un onglet de
 * l'app) et moins les quatre onglets d'administration : la modération se fait
 * au clavier, sur le site, et l'app le dit au compte qui en a le droit.
 */
export default function AccountScreen() {
  const { t } = useTranslation(['account', 'common', 'mobile']);
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarSpace = useTabBarSpace();
  const [tab, setTab] = useState<Tab>('overview');

  const isAuthenticated = useAppSelector(selectIsAuthenticated);
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
  const pendingCount = useAppSelector(selectReceivedCountByStatus).PENDING;
  const revenue = useAppSelector(selectConfirmedRevenueInCents);
  const pendingRevenue = useAppSelector(selectPendingRevenueInCents);
  const confirming = useAppSelector(selectConfirmRentalLoading);
  const confirmError = useAppSelector(selectConfirmRentalError);
  const cancelling = useAppSelector(selectCancelRentalLoading);
  const cancelError = useAppSelector(selectCancelRentalError);
  const { offer, cancellable } = useCancelRental();

  const refresh = useCallback(() => {
    // La sonde d'administration part avec les lectures du tableau de bord : un
    // 403 ne coûte rien, et c'est le seul moyen de savoir ce que peut ce compte.
    dispatch(confirmAdminAccessRequested());
    dispatch(listOwnerListingsRequested());
    dispatch(listReceivedRentalRequestsRequested());
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) refresh();
    }, [isAuthenticated, refresh]),
  );

  if (!isAuthenticated) return <SignInGate title={t('mobile:gate.accountTitle')} body={t('mobile:gate.accountBody')} />;

  const confirmedNights = receivedRaw
    .filter((request) => request.status === 'CONFIRMED')
    .reduce((total, request) => total + rentedNightCount(request), 0);
  const anyError = listingsError ?? receivedError;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: insets.top + 16, paddingBottom: tabBarSpace, gap: 20 }}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl tintColor={colors.accent} refreshing={false} onRefresh={refresh} />}
    >
      <Rise style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <Display size={34} style={{ flex: 1 }}>
            {t('account:dashboard.title')}
          </Display>
          <Button size="sm" icon={Plus} label={t('mobile:account.publish')} onPress={() => router.push('/publier')} />
        </View>
        <Text tone="muted">{t('account:dashboard.subtitle')}</Text>
        {session !== null && (
          <View
            style={{
              alignSelf: 'flex-start',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: colors.line,
              backgroundColor: colors.bgRaised,
              paddingHorizontal: 12,
              paddingVertical: 7,
            }}
          >
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.ok }} />
            <Ticket>{t('account:session.validUntil', { date: formatDay(session.validUntil) })}</Ticket>
          </View>
        )}
      </Rise>

      <Segmented<Tab>
        scrollable
        label={t('account:dashboard.title')}
        value={tab}
        onChange={setTab}
        options={TABS.map((name) => ({
          value: name,
          label: t(`account:dashboard.tab.${name}`),
          badge: name === 'received' ? pendingCount : undefined,
        }))}
      />

      {anyError !== null && <ApiUnreachable message={anyError} />}

      {tab === 'overview' &&
        (listingsLoading || receivedLoading ? (
          <View style={{ gap: 12 }}>
            <Skeleton height={168} />
            <Skeleton height={168} />
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
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
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
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
            </View>
          </View>
        ))}

      {tab === 'places' && (
        <>
          {listingsLoading && ownerListings.length === 0 && <Skeleton height={160} />}
          {!listingsLoading && ownerListings.length === 0 && (
            <EmptyState
              title={t('account:places.empty')}
              action={<Button size="sm" label={t('account:places.emptyAction')} onPress={() => router.push('/publier')} />}
            />
          )}
          {ownerListings.length > 0 && (
            <RowList items={ownerListings} keyOf={(listing) => listing.id} render={(listing) => <OwnerListingRow listing={listing} />} />
          )}
        </>
      )}

      {tab === 'received' && (
        <>
          <Notice tone="info">{t('account:received.hint')}</Notice>
          {confirmError !== null && (
            <Notice tone="error" title={t('common:error.title')}>
              {confirmError}
            </Notice>
          )}
          {cancelError !== null && (
            <Notice tone="error" title={t('common:error.title')}>
              {cancelError}
            </Notice>
          )}
          {receivedLoading && received.length === 0 && <Skeleton height={160} />}
          {!receivedLoading && received.length === 0 && <EmptyState title={t('account:received.empty')} />}
          {received.length > 0 && (
            <RowList
              items={received}
              keyOf={(request) => request.id}
              render={(request) => (
                <RentalRequestRow
                  request={request}
                  action={
                    request.status === 'PENDING' || cancellable(request, 'owner') ? (
                      <>
                        {request.status === 'PENDING' && (
                          <Button
                            size="sm"
                            icon={CircleCheck}
                            loading={confirming}
                            label={t('account:received.confirm')}
                            onPress={() => dispatch(confirmRentalRequestRequested({ requestId: request.id }))}
                          />
                        )}
                        {cancellable(request, 'owner') && (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={cancelling}
                            label={t('account:cancel.action')}
                            onPress={() => offer(request, 'owner')}
                          />
                        )}
                      </>
                    ) : undefined
                  }
                />
              )}
            />
          )}
        </>
      )}

      {tab === 'settings' && <Settings isAdmin={isAdmin} />}
    </ScrollView>
  );
}

const Settings = ({ isAdmin }: { isAdmin: boolean }) => {
  const { t } = useTranslation(['account', 'common', 'mobile']);
  const dispatch = useAppDispatch();
  const session = useAppSelector(selectSession);
  const loading = useAppSelector(selectChangePasswordLoading);
  const error = useAppSelector(selectChangePasswordError);
  const success = useAppSelector(selectChangePasswordSuccess);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [errors, setErrors] = useState<{ current?: string; next?: string }>({});

  useEffect(() => () => void dispatch(resetChangePasswordState()), [dispatch]);

  const submit = (): void => {
    const found = {
      current: current === '' ? t('account:validation.current') : undefined,
      next: isAcceptablePassword(next) ? undefined : t('account:validation.next'),
    };
    setErrors(found);
    if (found.current !== undefined || found.next !== undefined) return;
    dispatch(changePasswordRequested({ currentPassword: current, newPassword: next }));
    setCurrent('');
    setNext('');
  };

  return (
    <View style={{ gap: 16 }}>
      <Card style={{ gap: 12 }}>
        <Display size={20}>{t('account:session.title')}</Display>
        {session !== null && (
          <Text size={14} tone="muted" tabular>
            {t('account:session.validUntil', { date: formatDay(session.validUntil) })}
          </Text>
        )}
        <Button
          variant="outline"
          size="sm"
          icon={LogOut}
          label={t('account:session.signOut')}
          onPress={() => dispatch(logoutRequested())}
          style={{ alignSelf: 'flex-start' }}
        />
      </Card>

      <Card style={{ gap: 16 }}>
        <Display size={20}>{t('account:password.title')}</Display>
        {error !== null && (
          <Notice tone="error" title={t('common:error.title')}>
            {error}
          </Notice>
        )}
        {success && <Notice tone="success">{t('account:password.changed')}</Notice>}
        <Field
          label={t('account:password.current')}
          value={current}
          onChangeText={setCurrent}
          error={errors.current}
          secureTextEntry
          autoComplete="current-password"
          textContentType="password"
        />
        <Field
          label={t('account:password.next')}
          hint={t('account:password.hint')}
          value={next}
          onChangeText={setNext}
          error={errors.next}
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
        />
        <Button loading={loading} label={t('account:password.submit')} onPress={submit} style={{ alignSelf: 'flex-start' }} />
      </Card>

      {/* L'étiquette ambre du site, pour le seul compte que `GET /admin/access` reconnaît. */}
      {isAdmin && <AdminNote label={t('mobile:account.admin')} />}
    </View>
  );
};

const AdminNote = ({ label }: { label: string }) => {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.warnLine,
        backgroundColor: colors.warnBg,
        paddingHorizontal: 14,
        paddingVertical: 12,
      }}
    >
      <ShieldCheck size={16} color={colors.warn} />
      <Text size={13} weight="medium" tone="warn" style={{ flex: 1 }}>
        {label}
      </Text>
    </View>
  );
};
