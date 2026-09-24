import type { ReactNode } from 'react';
import { ActivityIndicator, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../theme/useTheme';
import { EmptyBay } from '../art/Glyphs';
import { Display, Text } from './Text';

// `--ease-signal` du site : un départ franc, une arrivée douce.
const EASE_SIGNAL = Easing.bezier(0.2, 0, 0, 1);

/** La place que prend la barre d'onglets flottante, encoche comprise. */
export const useTabBarSpace = (): number => {
  const insets = useSafeAreaInsets();
  return 58 + Math.max(insets.bottom, 10) + 16;
};

/**
 * `animate-rise` du site : l'élément monte de 18 px en apparaissant, avec
 * 90 ms de décalage par rang. Reanimated respecte la réduction des
 * animations du système, comme la règle `prefers-reduced-motion` du site.
 */
export const Rise = ({ order = 0, children, style }: { order?: number; children: ReactNode; style?: StyleProp<ViewStyle> }) => (
  <Animated.View
    entering={FadeInDown.duration(700)
      .delay(Math.min(order, 8) * 90)
      .easing(EASE_SIGNAL)}
    style={style}
  >
    {children}
  </Animated.View>
);

/** Une place vide, dessinée au sol : le « rien à afficher » du site. */
export const EmptyState = ({ title, body, action }: { title: string; body?: string; action?: ReactNode }) => {
  const { colors } = useTheme();
  return (
    <View
      style={{
        alignItems: 'center',
        gap: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: colors.lineStrong,
        backgroundColor: colors.bgRaised,
        paddingHorizontal: 24,
        paddingVertical: 44,
      }}
    >
      <EmptyBay color={colors.fgSubtle} />
      <Display size={18} weight="semibold" center style={{ marginTop: 6 }}>
        {title}
      </Display>
      {body !== undefined && (
        <Text size={14} tone="muted" center style={{ maxWidth: 300 }}>
          {body}
        </Text>
      )}
      {action !== undefined && <View style={{ marginTop: 6 }}>{action}</View>}
    </View>
  );
};

/** Le squelette du site : un bloc creux qui respire le temps d'un chargement. */
export const Skeleton = ({ height, radius = 16, style }: { height: number; radius?: number; style?: StyleProp<ViewStyle> }) => {
  const { colors } = useTheme();
  return (
    <Animated.View
      style={[
        {
          height,
          borderRadius: radius,
          backgroundColor: colors.bgSunken,
          animationName: { from: { opacity: 1 }, to: { opacity: 0.55 } },
          animationDuration: 900,
          animationIterationCount: 'infinite',
          animationDirection: 'alternate',
        },
        style,
      ]}
    />
  );
};

export const Loader = () => {
  const { colors } = useTheme();
  return (
    <View style={{ paddingVertical: 48, alignItems: 'center' }}>
      <ActivityIndicator color={colors.accent} />
    </View>
  );
};

/** Un intitulé de section : l'étiquette ticket en accent, puis le titre. */
export const SectionTitle = ({ eyebrow, title }: { eyebrow?: string; title: string }) => (
  <View style={{ gap: 10 }}>
    {eyebrow !== undefined && (
      <Text
        tone="accent"
        style={{ fontFamily: 'GeistMono_500Medium', fontSize: 11, letterSpacing: 1.54, textTransform: 'uppercase' }}
      >
        {eyebrow}
      </Text>
    )}
    <Display size={30} weight="bold">
      {title}
    </Display>
  </View>
);
