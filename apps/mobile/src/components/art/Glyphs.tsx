import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

const P_PATH =
  'M11 24V8h6.4c3.5 0 5.6 2 5.6 5.1s-2.1 5.2-5.6 5.2h-2.6V24H11zm3.8-8.6h2.2c1.6 0 2.6-.9 2.6-2.3s-1-2.2-2.6-2.2h-2.2v4.5z';

/**
 * Le panneau de stationnement européen : carré bleu, P blanc. C'est la marque,
 * et c'est aussi le seul endroit où le bleu est imposé plutôt que dérivé des
 * jetons — un panneau qui change de couleur n'est plus un panneau.
 */
export const ParkingMark = ({ size = 32 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" accessibilityElementsHidden importantForAccessibility="no">
    <Rect width={32} height={32} rx={7} fill="#1f46e0" />
    <Path d={P_PATH} fill="#ffffff" />
  </Svg>
);

/** Le panneau P, 32 × 32, à placer par un `transform` parent dans un dessin. */
export const ParkingGlyph = ({ fill = '#1f46e0' }: { fill?: string }) => (
  <G>
    <Rect width={32} height={32} rx={7} fill={fill} />
    <Path d={P_PATH} fill="#ffffff" />
  </G>
);

/**
 * Une voiture vue du dessus, capot vers +x, centrée sur l'origine : 100 × 52.
 * Une voiture garée se tourne par un `rotate` sur son groupe parent.
 */
export const Car = ({ color }: { color: string }) => (
  <G>
    <Rect x={-50} y={-26} width={100} height={52} rx={15} fill={color} />
    <Rect x={11} y={-31} width={8} height={6} rx={2} fill={color} />
    <Rect x={11} y={25} width={8} height={6} rx={2} fill={color} />
    <Path d="M22 -19 Q31 0 22 19 L9 15.5 Q13 0 9 -15.5 Z" fill="#0b0d12" opacity={0.82} />
    <Rect x={-22} y={-16} width={29} height={32} rx={7} fill="#ffffff" opacity={0.14} />
    <Path d="M-25 -16.5 L-37 -18 Q-42 0 -37 18 L-25 16.5 Q-28 0 -25 -16.5 Z" fill="#0b0d12" opacity={0.74} />
    <Rect x={44} y={-20} width={4} height={10} rx={2} fill="#fff6c2" />
    <Rect x={44} y={10} width={4} height={10} rx={2} fill="#fff6c2" />
    <Rect x={-49} y={-20} width={3} height={9} rx={1.5} fill="#ff5a4f" />
    <Rect x={-49} y={11} width={3} height={9} rx={1.5} fill="#ff5a4f" />
  </G>
);

/** Le panneau « stationnement interdit » : disque bleu, couronne et barre rouges. */
export const NoParkingSign = ({ size = 96 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 120 120" accessibilityElementsHidden importantForAccessibility="no">
    <Circle cx={60} cy={60} r={56} fill="#ffffff" />
    <Circle cx={60} cy={60} r={50} fill="#1f46e0" stroke="#d62828" strokeWidth={11} />
    <Path d="M28 28L92 92" stroke="#d62828" strokeWidth={11} />
  </Svg>
);

/**
 * Une place vide, dessinée comme au sol : deux lignes blanches, rien entre
 * elles. C'est le même motif que la vignette d'une annonce, en creux.
 */
export const EmptyBay = ({ color }: { color: string }) => (
  <Svg width={86} height={64} viewBox="0 0 96 72" accessibilityElementsHidden importantForAccessibility="no">
    <Path
      d="M14 6v60M82 6v60M14 6h68"
      stroke={color}
      strokeWidth={3}
      strokeLinecap="round"
      opacity={0.45}
      fill="none"
    />
    <Path d="M30 60h36" stroke={color} strokeWidth={3} strokeDasharray="6 6" strokeLinecap="round" opacity={0.3} />
    <Rect x={36} y={20} width={24} height={24} rx={6} fill="#1f46e0" opacity={0.9} />
    <Path
      d="M44.5 38V26h4.6c2.4 0 4 1.4 4 3.7s-1.6 3.8-4 3.8h-1.8V38h-2.8zm2.8-6.5h1.5c1.1 0 1.8-.6 1.8-1.7s-.7-1.6-1.8-1.6h-1.5v3.3z"
      fill="#fff"
    />
  </Svg>
);
