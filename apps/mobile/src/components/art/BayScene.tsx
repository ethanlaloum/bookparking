import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';

import { fonts, palette } from '../../theme/tokens';
import { Car, ParkingGlyph } from './Glyphs';

const MAX_LABEL = 12;

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * La place de l'annonce, en grand, entre deux voisines occupées : le box peint
 * au sol, le panneau P, et un cadre en pointillés qui marche autour. C'est
 * l'image de tête de la fiche — une place dessinée vaut mieux qu'un rectangle
 * gris. Si le téléphone réduit les animations, le dessin reste immobile.
 */
export const BayScene = ({ box }: { box: string }) => {
  const label = box.length > MAX_LABEL ? `${box.slice(0, MAX_LABEL - 1)}…` : box;
  const reduced = useReducedMotion();
  const march = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;
    march.value = withRepeat(withTiming(-24, { duration: 1400, easing: Easing.linear }), -1, false);
    pulse.value = withRepeat(withTiming(1, { duration: 2200, easing: Easing.bezier(0.2, 0, 0, 1) }), -1, false);
  }, [march, pulse, reduced]);

  const frameProps = useAnimatedProps(() => ({ strokeDashoffset: march.value }));
  const ringProps = useAnimatedProps(() => ({
    r: 46 * (0.8 + pulse.value * 1.2),
    opacity: reduced ? 0 : 0.75 * (1 - Math.min(pulse.value / 0.8, 1)),
  }));

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: '100%', aspectRatio: 16 / 9, backgroundColor: palette.bay }}
    >
      <Svg width="100%" height="100%" viewBox="0 0 720 400" preserveAspectRatio="xMidYMid slice">
        <Rect width={720} height={400} fill={palette.bay} />
        <Path
          d="M60 36V318M260 36V318M460 36V318M660 36V318M60 36H660"
          stroke="#e9edf5"
          strokeOpacity={0.5}
          strokeWidth={5}
          strokeLinecap="round"
          fill="none"
        />
        <Path d="M0 364H720" stroke={palette.marking[400]} strokeOpacity={0.8} strokeWidth={5} strokeDasharray="34 24" />

        <G transform="translate(160 176) rotate(91) scale(2.05)">
          <Car color="#e8ebf0" />
        </G>
        <G transform="translate(562 178) rotate(88) scale(2.05)">
          <Car color="#c9483b" />
        </G>

        <AnimatedRect
          x={282}
          y={58}
          width={156}
          height={238}
          rx={22}
          fill="#3a64f8"
          fillOpacity={0.14}
          stroke="#6d90ff"
          strokeWidth={3}
          strokeDasharray="12 12"
          animatedProps={frameProps}
        />
        <AnimatedCircle cx={360} cy={150} fill="#3a64f8" animatedProps={ringProps} />
        <G transform="translate(324 114) scale(2.25)">
          <ParkingGlyph />
        </G>
        <SvgText
          x={360}
          y={262}
          textAnchor="middle"
          fill={palette.marking[400]}
          fontFamily={fonts.mono.bold}
          fontSize={label.length > 6 ? 26 : 38}
          letterSpacing={3}
        >
          {label}
        </SvgText>
      </Svg>
    </View>
  );
};
