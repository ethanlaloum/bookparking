import { useId, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, Mask, Path, Pattern, RadialGradient, Rect, Stop } from 'react-native-svg';

import { useTheme } from '../../theme/useTheme';

interface InkSurfaceProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Le quadrillage de plan, qui s'efface vers les bords (`bg-blueprint`). */
  blueprint?: boolean;
}

/**
 * La surface d'encre du site (`surface-ink`) : bitume nuit, halo bleu panneau
 * en haut à droite, reflet de marquage en bas à gauche. React Native ne peint
 * pas de `radial-gradient` : les deux halos sont un SVG posé sous le contenu.
 */
export const InkSurface = ({ children, style, blueprint = false }: InkSurfaceProps) => {
  const { colors } = useTheme();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/gu, '');

  return (
    <View
      style={[
        {
          backgroundColor: colors.ink,
          borderRadius: 32,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.06)',
        },
        style,
      ]}
    >
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
        <Defs>
          <RadialGradient id={`halo-${uid}`} cx="88%" cy="0%" rx="55%" ry="75%" fx="88%" fy="0%">
            <Stop offset="0" stopColor="#3a64f8" stopOpacity={0.38} />
            <Stop offset="0.62" stopColor="#3a64f8" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id={`marking-${uid}`} cx="0%" cy="100%" rx="45%" ry="55%" fx="0%" fy="100%">
            <Stop offset="0" stopColor="#ffd23f" stopOpacity={0.1} />
            <Stop offset="0.62" stopColor="#ffd23f" stopOpacity={0} />
          </RadialGradient>
          <Pattern id={`grid-${uid}`} width={56} height={56} patternUnits="userSpaceOnUse">
            <Path d="M0 0.5H56M0.5 0V56" stroke="#ffffff" strokeOpacity={0.045} strokeWidth={1} />
          </Pattern>
          <RadialGradient id={`fade-${uid}`} cx="70%" cy="30%" rx="70%" ry="70%" fx="70%" fy="30%">
            <Stop offset="0" stopColor="#ffffff" stopOpacity={1} />
            <Stop offset="0.78" stopColor="#ffffff" stopOpacity={0} />
          </RadialGradient>
          <Mask id={`mask-${uid}`}>
            <Rect width="100%" height="100%" fill={`url(#fade-${uid})`} />
          </Mask>
        </Defs>
        {blueprint && (
          <Rect width="100%" height="100%" fill={`url(#grid-${uid})`} mask={`url(#mask-${uid})`} />
        )}
        <Rect width="100%" height="100%" fill={`url(#halo-${uid})`} />
        <Rect width="100%" height="100%" fill={`url(#marking-${uid})`} />
      </Svg>
      {children}
    </View>
  );
};
