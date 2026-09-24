import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { moneyLabelOf } from '@front/app/rental/domain/entities/RentalRequestView';
import { listMyRentalRequestsRequested } from '@front/app/rental/domain/use-cases/list-my-rental-requests/listMyRentalRequestsEpic';
import { selectIsAuthenticated } from '@front/selectors/auth/authSelectors';
import {
  selectCancelRentalError,
  selectCancelRentalLoading,
  selectMyRentalRequestsError,
  selectMyRentalRequestsLoaded,
  selectMyRentalRequestsLoading,
  selectSortedMyRequests,
} from '@front/selectors/rental/rentalSelectors';

import { ApiUnreachable } from '../../components/ApiUnreachable';
import { RentalRequestRow, RowList } from '../../components/RequestRows';
import { SignInGate } from '../../components/SignInGate';
import { Button } from '../../components/ui/Button';
import { EmptyState, Rise, Skeleton, useTabBarSpace } from '../../components/ui/Layout';
import { Notice } from '../../components/ui/Notice';
import { Display, Text } from '../../components/ui/Text';
import { useCancelRental } from '../../lib/useCancelRental';
import { useAppDispatch, useAppSelector } from '../../store/redux';
import { useTheme } from '../../theme/useTheme';

/** « Mes réservations » : l'onglet du tableau de bord du site, promu en onglet de l'app. */
export default function BookingsScreen() {
  const { t } = useTranslation(['account', 'common', 'mobile']);
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarSpace = useTabBarSpace();

  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const mine = useAppSelector(selectSortedMyRequests);
  const loading = useAppSelector(selectMyRentalRequestsLoading);
  const loaded = useAppSelector(selectMyRentalRequestsLoaded);
  const error = useAppSelector(selectMyRentalRequestsError);
  const cancelling = useAppSelector(selectCancelRentalLoading);
  const cancelError = useAppSelector(selectCancelRentalError);
  const { offer, cancellable } = useCancelRental();

  // Relue à chaque retour sur l'onglet : une demande payée ailleurs, confirmée
  // ou expirée entre-temps doit s'y lire sans tirer l'écran.
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) dispatch(listMyRentalRequestsRequested());
    }, [dispatch, isAuthenticated]),
  );

  if (!isAuthenticated) return <SignInGate title={t('mobile:gate.bookingsTitle')} body={t('mobile:gate.bookingsBody')} />;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: insets.top + 16, paddingBottom: tabBarSpace, gap: 20 }}
      refreshControl={
        <RefreshControl tintColor={colors.accent} refreshing={false} onRefresh={() => dispatch(listMyRentalRequestsRequested())} />
      }
    >
      <Rise>
        <Display size={34}>{t('account:mine.title')}</Display>
        <Text tone="muted" style={{ marginTop: 6 }}>
          {t('mobile:bookings.subtitle')}
        </Text>
      </Rise>

      {error !== null && <ApiUnreachable message={error} />}
      {cancelError !== null && (
        <Notice tone="error" title={t('common:error.title')}>
          {cancelError}
        </Notice>
      )}

      {loading && !loaded && (
        <View style={{ gap: 12 }}>
          <Skeleton height={130} />
          <Skeleton height={130} />
        </View>
      )}

      {loaded && mine.length === 0 && (
        <EmptyState
          title={t('account:mine.empty')}
          action={<Button size="sm" label={t('account:mine.emptyAction')} onPress={() => router.navigate('/recherche')} />}
        />
      )}

      {mine.length > 0 && (
        <Rise order={1}>
          <RowList
            items={mine}
            keyOf={(request) => request.id}
            render={(request) => {
              const money = moneyLabelOf(request);
              return (
                <RentalRequestRow
                  request={request}
                  moneyLabel={t(`account:money.${money.key}`, { amount: money.amount })}
                  action={
                    cancellable(request, 'renter') ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={cancelling}
                        label={t('account:cancel.action')}
                        onPress={() => offer(request, 'renter')}
                      />
                    ) : undefined
                  }
                />
              );
            }}
          />
        </Rise>
      )}
    </ScrollView>
  );
}
