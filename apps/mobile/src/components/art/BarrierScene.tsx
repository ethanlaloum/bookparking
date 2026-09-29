import { useEffect, useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { G } from 'react-native-svg';

import { useTheme } from '../../theme/useTheme';
import { Car } from './Glyphs';

// Le repère du site (`BarrierScene.tsx` du front) : 360 × 150, la voie de
// gauche à droite, le poteau en (252, 24), le bras de 110 en travers.
const WIDTH = 360;
const HEIGHT = 150;
const EASE_SIGNAL = Easing.bezier(0.2, 0, 0, 1);

/**
 * La barrière du site, vue de dessus. En attente, le bras hésite et la
 * voiture tourne au ralenti ; ouverte, il pivote hors de la voie et la
 * voiture passe. Des vues animées par Reanimated plutôt qu'un SVG animé : le
 * tracé fixe reste en SVG, le mouvement ne passe que par des `transform`.
 * Si le téléphone réduit les animations, la scène saute à son état final.
 */
export const BarrierScene = ({ mode }: { mode: 'waiting' | 'opening' }) => {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const [scale, setScale] = useState(1);
  const arm = useSharedValue(0);
  const carX = useSharedValue(0);
  const carY = useSharedValue(0);

  useEffect(() => {
    if (mode === 'opening') {
      carY.value = 0;
      if (reduced) {
        arm.value = -88;
        carX.value = 150;
        return;
      }
      arm.value = withDelay(350, withSequence(withTiming(-94, { duration: 630, easing: EASE_SIGNAL }), withTiming(-88, { duration: 270 })));
      carX.value = withDelay(1100, withTiming(150, { duration: 1300, easing: Easing.bezier(0.45, 0, 0.2, 1) }));
      return;
    }
    if (reduced) return;
    arm.value = withRepeat(
      withSequence(withTiming(5, { duration: 1450, easing: EASE_SIGNAL }), withTiming(4, { duration: 300 }), withTiming(0, { duration: 1450, easing: EASE_SIGNAL })),
      -1,
    );
    carY.value = withRepeat(withSequence(withTiming(-0.8, { duration: 175 }), withTiming(0, { duration: 175 })), -1);
  }, [arm, carX, carY, mode, reduced]);

  const armStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${arm.value}deg` }] }));
  const carStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: carX.value * scale }, { translateY: carY.value * scale }],
  }));

  const onLayout = (event: LayoutChangeEvent): void => setScale(event.nativeEvent.layout.width / WIDTH);
  const at = (value: number): number => value * scale;
  const open = mode === 'opening';

  return (
    <View
      onLayout={onLayout}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: '100%', aspectRatio: WIDTH / HEIGHT, overflow: 'hidden', backgroundColor: colors.bgRaised }}
    >
      <View style={{ position: 'absolute', left: 0, right: 0, top: at(34), height: at(100), backgroundColor: colors.bgSunken }} />
      <View style={{ position: 'absolute', left: 0, right: 0, top: at(37), height: 2, backgroundColor: colors.lineStrong }} />
      <View style={{ position: 'absolute', left: 0, right: 0, top: at(129), height: 2, backgroundColor: colors.lineStrong }} />
      {Array.from({ length: 12 }, (_, index) => (
        <View
          key={index}
          style={{ position: 'absolute', left: at(index * 30), top: at(83), width: at(16), height: 3, backgroundColor: colors.lineStrong }}
        />
      ))}
      <View
        style={{
          position: 'absolute',
          left: at(230),
          top: at(40),
          height: at(88),
          width: 0,
          borderLeftWidth: 4,
          borderStyle: 'dashed',
          borderColor: 'rgba(255, 255, 255, 0.35)',
        }}
      />

      <Animated.View style={[{ position: 'absolute', left: at(150 - 31), top: at(84 - 16), width: at(62), height: at(32) }, carStyle]}>
        <Svg width="100%" height="100%" viewBox="-50 -26 100 52">
          <G>
            <Car color="#1f46e0" />
          </G>
        </Svg>
      </Animated.View>

      <Animated.View
        style={[
          {
            position: 'absolute',
            left: at(247),
            top: at(22),
            width: at(10),
            height: at(110),
            borderRadius: at(5),
            backgroundColor: '#ffffff',
            overflow: 'hidden',
            transformOrigin: [at(5), at(2), 0],
          },
          armStyle,
        ]}
      >
        {[0, 1, 2, 3].map((stripe) => (
          <View key={stripe} style={{ position: 'absolute', left: 0, right: 0, top: at(18 + stripe * 24), height: at(12), backgroundColor: '#ff5a4f' }} />
        ))}
      </Animated.View>

      <View
        style={{
          position: 'absolute',
          left: at(243),
          top: at(14),
          width: at(18),
          height: at(18),
          borderRadius: at(5),
          backgroundColor: '#2a2f3d',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View style={{ width: at(8), height: at(8), borderRadius: at(4), backgroundColor: open ? '#22c55e' : '#ff5a4f' }} />
      </View>
    </View>
  );
};
