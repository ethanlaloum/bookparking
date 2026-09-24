import { View } from 'react-native';
import Svg, { G, Path, Rect, Text as SvgText } from 'react-native-svg';

import { fonts, palette } from '../../theme/tokens';
import { ParkingGlyph } from './Glyphs';

const MAX_LABEL = 10;

/**
 * La vignette d'une annonce : sa place, vue du dessus, avec le numéro de box
 * peint au sol. Les « photos » d'une annonce ne sont que des références, pas
 * des images qu'on puisse afficher ; plutôt qu'un gris vide, la vignette montre
 * la seule donnée visuelle certaine — le box.
 */
export const BayThumbnail = ({ box, width = 80, height = 100, radius = 12 }: { box: string; width?: number; height?: number; radius?: number }) => {
  const label = box.length > MAX_LABEL ? `${box.slice(0, MAX_LABEL - 1)}…` : box;

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width, height, borderRadius: radius, overflow: 'hidden', backgroundColor: palette.bay }}
    >
      <Svg width="100%" height="100%" viewBox="0 0 96 120" preserveAspectRatio="xMidYMid slice">
        <Rect width={96} height={120} fill={palette.bay} />
        <Path d="M12 -4V124M84 -4V124" stroke="#e9edf5" strokeOpacity={0.5} strokeWidth={3} />
        <Path d="M12 10H84" stroke="#e9edf5" strokeOpacity={0.5} strokeWidth={3} />
        <G transform="translate(30 30) scale(1.125)">
          <ParkingGlyph />
        </G>
        <SvgText
          x={48}
          y={96}
          textAnchor="middle"
          fill={palette.marking[400]}
          fontFamily={fonts.mono.semibold}
          fontSize={label.length > 6 ? 10 : 13}
          letterSpacing={0.8}
        >
          {label}
        </SvgText>
      </Svg>
    </View>
  );
};
