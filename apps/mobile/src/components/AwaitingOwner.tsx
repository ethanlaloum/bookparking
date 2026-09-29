import { Check, KeyRound, ShieldCheck, type LucideIcon } from 'lucide-react-native';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import type { RentalRequestView } from '@front/app/rental/domain/entities/RentalRequestView';
import { formatDeadline } from '@front/lib/format';

import { useTheme } from '../theme/useTheme';
import { BarrierScene } from './art/BarrierScene';
import { Text } from './ui/Text';

type StepState = 'done' | 'current' | 'next';

const PulseRing = ({ color }: { color: string }) => {
  const reduced = useReducedMotion();
  const pulse = useSharedValue(0);
  useEffect(() => {
    if (!reduced) pulse.value = withRepeat(withTiming(1, { duration: 2200, easing: Easing.bezier(0.2, 0, 0, 1) }), -1, false);
  }, [pulse, reduced]);
  const style = useAnimatedStyle(() => ({
    opacity: reduced ? 0 : 0.75 * (1 - Math.min(pulse.value / 0.8, 1)),
    transform: [{ scale: 0.8 + pulse.value * 1.4 }],
  }));
  return <Animated.View style={[{ position: 'absolute', width: 32, height: 32, borderRadius: 16, backgroundColor: color }, style]} />;
};

const Step = ({ state, title, hint, icon: Icon, label, last = false }: { state: StepState; title: string; hint: string; icon?: LucideIcon; label?: string; last?: boolean }) => {
  const { colors } = useTheme();
  const look = {
    done: { bg: colors.ok, fg: '#ffffff' },
    current: { bg: colors.accent, fg: colors.onBrand },
    next: { bg: colors.bgSunken, fg: colors.fgSubtle },
  }[state];

  return (
    <View style={{ flexDirection: 'row', gap: 14, paddingBottom: last ? 0 : 18 }}>
      {!last && <View style={{ position: 'absolute', left: 15.5, top: 34, bottom: 0, width: 1, backgroundColor: state === 'done' ? colors.okLine : colors.line }} />}
      <View style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
        {state === 'current' && <PulseRing color={colors.accent} />}
        <View style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: look.bg }}>
          {Icon !== undefined ? <Icon size={16} color={look.fg} /> : <Text size={13} weight="bold" style={{ color: look.fg }}>{label}</Text>}
        </View>
      </View>
      <View style={{ flex: 1, paddingTop: 4, gap: 2 }}>
        <Text size={15} weight="semibold" tone={state === 'next' ? 'subtle' : 'fg'}>
          {title}
        </Text>
        <Text size={13} tone="muted">
          {hint}
        </Text>
      </View>
    </View>
  );
};

/** L'attente après le paiement, comme sur le site : la barrière baissée et les trois étapes. */
export const AwaitingOwner = ({ request }: { request: RentalRequestView }) => {
  const { t } = useTranslation('rental');
  const { colors } = useTheme();
  const confirmed = request.status === 'CONFIRMED';

  return (
    <View style={{ gap: 20 }}>
      <View style={{ borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.line }}>
        <BarrierScene mode={confirmed ? 'opening' : 'waiting'} />
      </View>
      <View accessibilityLabel={t('payment.waiting.title')}>
        <Step state="done" icon={ShieldCheck} title={t('payment.waiting.stepPaid')} hint={t('payment.waiting.stepPaidHint')} />
        <Step
          state={confirmed ? 'done' : 'current'}
          icon={confirmed ? Check : undefined}
          label="2"
          title={t('payment.waiting.stepOwner')}
          hint={
            request.answerBy === null
              ? t('payment.waiting.stepOwnerHintNoDate')
              : t('payment.waiting.stepOwnerHint', { date: formatDeadline(request.answerBy) })
          }
        />
        <Step state={confirmed ? 'done' : 'next'} icon={KeyRound} title={t('payment.waiting.stepConfirmed')} hint={t('payment.waiting.stepConfirmedHint')} last />
      </View>
      {!confirmed && (
        <View style={{ borderRadius: 12, padding: 14, gap: 6, backgroundColor: colors.bgSunken }}>
          <Text size={14} tone="muted">
            {t('payment.waiting.notify')}
          </Text>
          <Text size={12} tone="subtle">
            {t('payment.waiting.whatIf')}
          </Text>
        </View>
      )}
    </View>
  );
};
