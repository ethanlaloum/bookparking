import { router } from 'expo-router';
import {
  Ban,
  Banknote,
  Bell,
  CalendarCheck,
  CalendarX,
  CreditCard,
  Hourglass,
  Inbox,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  destinationOf,
  isUnread,
  toneOf,
  type Notification,
  type NotificationKind,
  type NotificationTone,
} from '@front/app/notification/domain/entities/Notification';
import { listNotificationsRequested } from '@front/app/notification/domain/use-cases/list-notifications/listNotificationsEpic';
import { markNotificationsReadRequested } from '@front/app/notification/domain/use-cases/mark-notifications-read/markNotificationsReadEpic';
import { formatShortDay, formatShortMoment } from '@front/lib/format';
import {
  selectNotifications,
  selectNotificationsError,
  selectUnreadNotificationCount,
} from '@front/selectors/notification/notificationSelectors';

import { Rise } from '../components/ui/Layout';
import { openNotificationDestination } from '../lib/openNotificationDestination';
import { Display, Text } from '../components/ui/Text';
import { useAppDispatch, useAppSelector } from '../store/redux';
import { useTheme } from '../theme/useTheme';

const ICON: Record<NotificationKind, LucideIcon> = {
  RENTAL_REQUEST_RECEIVED: Inbox,
  RENTAL_REQUEST_ACCEPTED: CalendarCheck,
  RENTAL_REQUEST_DECLINED: CalendarX,
  RENTAL_REQUEST_EXPIRED: Hourglass,
  RENTAL_REQUEST_UNANSWERED: Hourglass,
  RENTAL_CANCELLED_BY_RENTER: CalendarX,
  RENTAL_CANCELLED_BY_OWNER: CalendarX,
  RENTAL_CANCELLED_BY_OPERATOR: Ban,
  RENTAL_PAYMENT_FAILED: CreditCard,
  RENTAL_PAYOUT_SENT: Banknote,
};

const follow = (notification: Notification): void => {
  router.back();
  openNotificationDestination(destinationOf(notification));
};

const NotificationRow = ({ notification }: { notification: Notification }) => {
  const { t } = useTranslation('common');
  const { colors } = useTheme();
  const Icon = ICON[notification.kind];
  const unread = isUnread(notification);
  const chip: Record<NotificationTone, { bg: string; fg: string }> = {
    positive: { bg: colors.okBg, fg: colors.ok },
    negative: { bg: colors.dangerBg, fg: colors.danger },
    neutral: { bg: colors.warnBg, fg: colors.warn },
  };
  const tone = chip[toneOf(notification)];

  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => follow(notification)}
      style={({ pressed }) => ({
        flexDirection: 'row',
        gap: 12,
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: unread ? colors.accent : colors.line,
        backgroundColor: pressed ? colors.bgSunken : unread ? colors.accentSoft : colors.bgRaised,
      })}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: tone.bg,
        }}
      >
        <Icon size={18} color={tone.fg} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
          <Text size={15} weight={unread ? 'semibold' : 'medium'} style={{ flex: 1 }}>
            {t(`notification.kind.${notification.kind}`)}
          </Text>
          {unread && (
            <View
              accessibilityLabel={t('notification.unread')}
              style={{ marginTop: 7, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent }}
            />
          )}
        </View>
        <Text size={13} tone="muted" numberOfLines={1}>
          {t('notification.place', { address: notification.address, box: notification.box })}
        </Text>
        <Text size={12} tone="subtle" tabular>
          {t('notification.period', {
            from: formatShortDay(`${notification.fromDay}T00:00:00.000Z`),
            to: formatShortDay(`${notification.toDay}T00:00:00.000Z`),
          })}
          {' · '}
          {formatShortMoment(notification.createdAt)}
        </Text>
      </View>
    </Pressable>
  );
};

/**
 * La feuille des notifications : l'ouvrir les lit toutes. La pastille tombe,
 * et celles qui étaient nouvelles restent marquées jusqu'à la relecture.
 */
export default function NotificationsScreen() {
  const { t } = useTranslation('common');
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const notifications = useAppSelector(selectNotifications);
  const unreadCount = useAppSelector(selectUnreadNotificationCount);
  const error = useAppSelector(selectNotificationsError);
  const [unreadWhenOpened] = useState(unreadCount);

  useEffect(() => {
    if (unreadWhenOpened > 0) dispatch(markNotificationsReadRequested());
  }, [dispatch, unreadWhenOpened]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24, gap: 12 }}
      refreshControl={
        <RefreshControl tintColor={colors.accent} refreshing={false} onRefresh={() => dispatch(listNotificationsRequested())} />
      }
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 }}>
        <Display size={28}>{t('notification.title')}</Display>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('action.close')}
          hitSlop={8}
          onPress={() => router.back()}
          style={{
            width: 36,
            height: 36,
            borderRadius: 999,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.bgSunken,
          }}
        >
          <X size={18} color={colors.fg} />
        </Pressable>
      </View>

      {error !== null && notifications.length === 0 && (
        <Text size={14} tone="muted" center style={{ paddingVertical: 24 }}>
          {t('notification.error')}
        </Text>
      )}

      {error === null && notifications.length === 0 && (
        <View style={{ alignItems: 'center', gap: 8, paddingVertical: 40, paddingHorizontal: 24 }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.bgSunken,
            }}
          >
            <Bell size={22} color={colors.fgSubtle} />
          </View>
          <Text weight="semibold" center>
            {t('notification.empty')}
          </Text>
          <Text size={14} tone="muted" center>
            {t('notification.emptyHint')}
          </Text>
        </View>
      )}

      {notifications.map((notification, index) => (
        <Rise key={notification.id} order={index}>
          <NotificationRow notification={notification} />
        </Rise>
      ))}
    </ScrollView>
  );
}
