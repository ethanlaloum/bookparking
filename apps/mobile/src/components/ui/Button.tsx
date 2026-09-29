import * as Haptics from 'expo-haptics';
import type { LucideIcon } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { cubicBezier } from 'react-native-reanimated';

import { fonts, palette } from '../../theme/tokens';
import { useTheme, type Theme } from '../../theme/useTheme';
import { Text } from './Text';

export type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'danger' | 'inverse' | 'glass';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  /** L'icône après le libellé : une flèche qui mène quelque part. */
  trailingIcon?: LucideIcon;
  block?: boolean;
  disabled?: boolean;
  loading?: boolean;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

// `--ease-signal` du site. Reanimated ne lit pas `cubic-bezier(…)` en chaîne sur
// iOS — seuls les noms prédéfinis (`ease-out`…) passent — : la courbe se
// construit par `cubicBezier`. Le web l'acceptait, ce qui l'a masqué à l'aperçu.
const EASE_SIGNAL = cubicBezier(0.2, 0, 0, 1);

const SIZE = {
  sm: { minHeight: 36, paddingHorizontal: 14, borderRadius: 8, fontSize: 14, icon: 16 },
  md: { minHeight: 44, paddingHorizontal: 20, borderRadius: 12, fontSize: 14, icon: 16 },
  lg: { minHeight: 52, paddingHorizontal: 28, borderRadius: 12, fontSize: 16, icon: 20 },
} as const;

const look = (variant: ButtonVariant, { colors, shadows }: Theme, pressed: boolean) => {
  switch (variant) {
    case 'primary':
      return {
        box: {
          backgroundColor: pressed ? colors.brandPressed : colors.brand,
          boxShadow: shadows.brand,
        },
        fg: colors.onBrand,
      };
    case 'outline':
      return {
        box: {
          backgroundColor: pressed ? colors.bgSunken : colors.bgRaised,
          borderWidth: 1,
          borderColor: pressed ? colors.fgSubtle : colors.lineStrong,
        },
        fg: colors.fg,
      };
    case 'ghost':
      return { box: { backgroundColor: pressed ? colors.bgSunken : 'transparent' }, fg: colors.fgMuted };
    case 'danger':
      return {
        box: { backgroundColor: colors.dangerBg, borderWidth: 1, borderColor: pressed ? colors.danger : colors.dangerLine },
        fg: colors.danger,
      };
    // Sur l'encre ou sur le bleu : le blanc est le seul fond qui ne se confond
    // avec aucun des deux.
    case 'inverse':
      return {
        box: {
          backgroundColor: pressed ? palette.asphalt[100] : '#ffffff',
          boxShadow: '0px 10px 24px -12px rgba(0, 0, 0, 0.6)',
        },
        fg: palette.asphalt[950],
      };
    case 'glass':
      return {
        box: {
          backgroundColor: pressed ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
          borderWidth: 1,
          borderColor: pressed ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)',
        },
        fg: '#ffffff',
      };
  }
};

/**
 * Le bouton du site : coins de 12 px, ombre bleue sous le primaire, et
 * l'enfoncement à 97 % au toucher — ici une transition Reanimated, là-bas une
 * transition CSS sur `scale`. Le primaire donne un léger retour haptique.
 */
export const Button = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  trailingIcon: Trailing,
  block = false,
  disabled = false,
  loading = false,
  accessibilityHint,
  style,
}: ButtonProps) => {
  const theme = useTheme();
  const [pressed, setPressed] = useState(false);
  const inactive = disabled || loading;
  const { box, fg } = look(variant, theme, pressed && !inactive);
  const dims = SIZE[size];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={() => {
        if (variant === 'primary') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
      }}
      style={[block && { alignSelf: 'stretch' }, style]}
    >
      <Animated.View
        style={[
          {
            minHeight: dims.minHeight,
            paddingHorizontal: dims.paddingHorizontal,
            borderRadius: dims.borderRadius,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            opacity: inactive ? 0.45 : 1,
            transform: [{ scale: pressed && !inactive ? 0.97 : 1 }],
            transitionProperty: ['transform', 'backgroundColor'],
            transitionDuration: 200,
            transitionTimingFunction: EASE_SIGNAL,
          },
          box,
        ]}
      >
        {loading ? <ActivityIndicator size="small" color={fg} /> : Icon && <Icon size={dims.icon} color={fg} />}
        <Text
          numberOfLines={1}
          style={{
            color: fg,
            fontFamily: size === 'lg' ? fonts.sans.semibold : fonts.sans.medium,
            fontSize: dims.fontSize,
            lineHeight: Math.round(dims.fontSize * 1.3),
          }}
        >
          {label}
        </Text>
        {Trailing && <Trailing size={dims.icon} color={fg} />}
      </Animated.View>
    </Pressable>
  );
};
