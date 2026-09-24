import type { LucideIcon } from 'lucide-react-native';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { fonts } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';
import { Text } from './Text';

export type BadgeTone = 'neutral' | 'accent' | 'ok' | 'warn' | 'danger';

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  icon?: LucideIcon;
  /** La pastille de statut : un point de la couleur du texte. */
  dot?: boolean;
  mono?: boolean;
  large?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const Badge = ({ label, tone = 'neutral', icon: Icon, dot = false, mono = false, large = false, style }: BadgeProps) => {
  const { colors } = useTheme();
  const look = {
    neutral: { bg: colors.bgSunken, fg: colors.fgMuted, ring: colors.line },
    accent: { bg: colors.brand, fg: colors.onBrand, ring: 'transparent' },
    ok: { bg: colors.okBg, fg: colors.ok, ring: colors.okLine },
    warn: { bg: colors.warnBg, fg: colors.warn, ring: colors.warnLine },
    danger: { bg: colors.dangerBg, fg: colors.danger, ring: colors.dangerLine },
  }[tone];
  const fontSize = large ? 13 : 12;

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          alignSelf: 'flex-start',
          gap: 6,
          borderRadius: 999,
          paddingHorizontal: large ? 12 : 10,
          paddingVertical: large ? 6 : 4,
          backgroundColor: look.bg,
          borderWidth: 1,
          borderColor: look.ring,
        },
        style,
      ]}
    >
      {dot && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: look.fg }} />}
      {Icon && <Icon size={14} color={look.fg} />}
      <Text
        numberOfLines={1}
        style={{
          color: look.fg,
          fontFamily: mono ? fonts.mono.medium : fonts.sans.medium,
          fontSize,
          lineHeight: fontSize + 2,
        }}
      >
        {label}
      </Text>
    </View>
  );
};
