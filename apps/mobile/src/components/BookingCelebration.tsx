import * as Haptics from 'expo-haptics';
import { ArrowRight, X } from 'lucide-react-native';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import { markNotificationReadRequested } from '@front/app/notification/domain/use-cases/mark-notification-read/markNotificationReadEpic';
import { listMyRentalRequestsRequested } from '@front/app/rental/domain/use-cases/list-my-rental-requests/listMyRentalRequestsEpic';
import { formatShortDay } from '@front/lib/format';
import { selectIsAuthenticated } from '@front/selectors/auth/authSelectors';
import { selectBookingToCelebrate } from '@front/selectors/notification/notificationSelectors';
import { selectMyRentalRequests } from '@front/selectors/rental/rentalSelectors';

import { openNotificationDestination } from '../lib/openNotificationDestination';
import { useAppDispatch, useAppSelector } from '../store/redux';
import { fonts } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { AccessInstructions } from './AccessInstructions';
import { BarrierScene } from './art/BarrierScene';
import { Button } from './ui/Button';
import { Display, Text, Ticket } from './ui/Text';

const CONFETTI_COLORS = ['#1f46e0', '#ffd23f', '#22c55e', '#ff5a4f', '#3a64f8', '#ffffff'];

// Le même éventail que sur le site : calculé une fois, sans hasard.
const CONFETTI = Array.from({ length: 24 }, (_, index) => {
  const angle = (index / 24) * Math.PI * 2;
  const reach = 80 + (index % 5) * 20;
  return {
    color: CONFETTI_COLORS[index % CONFETTI_COLORS.length] ?? '#ffffff',
    x: Math.round(Math.cos(angle) * reach),
    y: Math.round(Math.sin(angle) * reach * 0.8 + 50),
    turn: (index % 2 === 0 ? 1 : -1) * (220 + index * 17),
    wide: index % 3 === 0,
  };
});

const ConfettiPiece = ({ piece, progress }: { piece: (typeof CONFETTI)[number]; progress: SharedValue<number> }) => {
  const style = useAnimatedStyle(() => ({
    opacity: progress.value === 0 ? 0 : 1 - progress.value,
    transform: [
      { translateX: piece.x * progress.value },
      { translateY: piece.y * progress.value },
      { rotate: `${piece.turn * progress.value}deg` },
    ],
  }));
  return (
    <Animated.View
      style={[
        { position: 'absolute', width: piece.wide ? 12 : 6, height: piece.wide ? 6 : 10, borderRadius: 2, backgroundColor: piece.color },
        style,
      ]}
    />
  );
};

const dayOf = (day: string): string => formatShortDay(`${day}T00:00:00.000Z`);

/**
 * La réservation confirmée, fêtée comme sur le site : la barrière se lève, la
 * voiture passe, les consignes sont là. Montée à la racine, elle s'ouvre
 * par-dessus n'importe quel écran dès que la cloche rapporte une confirmation
 * pas encore vue — et la fermer la marque lue, sur le site aussi.
 */
export const BookingCelebration = () => {
  const { t } = useTranslation(['common', 'account']);
  const dispatch = useAppDispatch();
  const { colors, shadows } = useTheme();
  const reduced = useReducedMotion();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const booking = useAppSelector(selectBookingToCelebrate);
  const mine = useAppSelector(selectMyRentalRequests);
  const confetti = useSharedValue(0);
  const check = useSharedValue(0);

  const bookingId = isAuthenticated ? (booking?.id ?? null) : null;
  const request = booking === null ? null : (mine.find((candidate) => candidate.id === booking.requestId) ?? null);

  useEffect(() => {
    if (bookingId === null) return;
    dispatch(listMyRentalRequestsRequested());
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    confetti.value = 0;
    check.value = 0;
    check.value = reduced ? 1 : withSequence(withTiming(1.1, { duration: 330, easing: Easing.bezier(0.34, 1.56, 0.64, 1) }), withTiming(1, { duration: 200 }));
    if (!reduced) confetti.value = withDelay(1100, withTiming(1, { duration: 1600, easing: Easing.bezier(0.1, 0.7, 0.3, 1) }));
  }, [bookingId, check, confetti, dispatch, reduced]);

  const checkStyle = useAnimatedStyle(() => ({ transform: [{ scale: check.value }], opacity: Math.min(check.value, 1) }));

  if (bookingId === null || booking === null) return null;

  const dismiss = (): void => {
    dispatch(markNotificationReadRequested({ notificationId: booking.id }));
  };

  return (
    <Modal transparent animationType="fade" visible onRequestClose={dismiss}>
      <View style={{ flex: 1, justifyContent: 'center', padding: 16, backgroundColor: 'rgba(11, 13, 18, 0.6)' }}>
        <View style={{ borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: colors.line, backgroundColor: colors.bgRaised, boxShadow: shadows.panel }}>
          <View>
            <BarrierScene mode="opening" />
            <View pointerEvents="none" style={{ position: 'absolute', top: '50%', left: '50%' }}>
              {CONFETTI.map((piece, index) => (
                <ConfettiPiece key={index} piece={piece} progress={confetti} />
              ))}
            </View>
          </View>

          <View style={{ padding: 20, gap: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Animated.View style={checkStyle}>
                <Svg width={40} height={40} viewBox="0 0 40 40">
                  <Circle cx={20} cy={20} r={19} fill={colors.ok} />
                  <Path d="M12 20.5 L17.5 26 L28 14.5" fill="none" stroke="#ffffff" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </Animated.View>
              <View style={{ flex: 1 }}>
                <Ticket tone="ok">{t('common:celebration.eyebrow')}</Ticket>
                <Display size={26}>{t('common:celebration.title')}</Display>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('common:celebration.close')}
                hitSlop={8}
                onPress={dismiss}
                style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgSunken }}
              >
                <X size={18} color={colors.fg} />
              </Pressable>
            </View>

            <Text size={14} tone="muted">
              {booking.fromDay === booking.toDay
                ? t('common:celebration.bodySingleDay', { day: dayOf(booking.fromDay) })
                : t('common:celebration.body', { from: dayOf(booking.fromDay), to: dayOf(booking.toDay) })}
            </Text>
            <Text size={15} weight="medium">
              {booking.address} · <Text size={14} style={{ fontFamily: fonts.mono.medium }}>{booking.box}</Text>
            </Text>

            {request?.accessInstructions ? (
              <AccessInstructions instructions={request.accessInstructions} />
            ) : (
              <View style={{ borderRadius: 12, padding: 14, backgroundColor: colors.bgSunken }}>
                <Text size={14} tone="muted">
                  {request === null ? t('common:celebration.accessPending') : t('common:celebration.accessLater')}
                </Text>
              </View>
            )}

            <Button
              label={t('common:celebration.cta')}
              trailingIcon={ArrowRight}
              onPress={() => {
                dismiss();
                openNotificationDestination('mine');
              }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};
