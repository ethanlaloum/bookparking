/**
 * « Signal Riviera », reporté de `apps/front/src/index.css`. Trois matières,
 * prises à la rue niçoise : le bleu du panneau P (la marque), l'encre du
 * bitume (les surfaces sombres qui portent le propos) et le jaune des marquages
 * au sol (rare, et seulement sur l'encre). Une teinte qui change ici change
 * aussi dans `index.css` : les deux applications parlent la même langue.
 */
export const palette = {
  signal: {
    50: '#eef4ff',
    100: '#d9e6ff',
    200: '#bcd3ff',
    300: '#8eb6ff',
    400: '#598eff',
    500: '#3a64f8',
    600: '#1f46e0',
    700: '#1a37b4',
    800: '#1b318f',
    900: '#1c2f71',
    950: '#141e45',
  },
  asphalt: {
    50: '#f4f5f8',
    100: '#eceef2',
    200: '#dde1e8',
    300: '#c3cad6',
    400: '#8a95ab',
    500: '#5f6d8b',
    600: '#4b5672',
    700: '#3e465d',
    800: '#232836',
    900: '#141821',
    950: '#0b0d12',
  },
  marking: { 300: '#ffe38a', 400: '#ffd23f', 500: '#f5b700', 600: '#e09b14' },
  riviera: { 400: '#3fb6e8', 500: '#1f9bd1' },
  ticketPaper: '#f7f4ea',
  bay: '#161a24',
} as const;

/**
 * `accent` est une couleur de TEXTE (liens, icônes) ; `brand` est une couleur
 * de FOND (boutons, pastilles). En sombre, les deux divergent : le bleu qui se
 * lit sur l'encre est trop clair pour porter du blanc, et inversement.
 */
export interface ColorTokens {
  bg: string;
  bgRaised: string;
  bgSunken: string;
  fg: string;
  fgMuted: string;
  fgSubtle: string;
  line: string;
  lineStrong: string;
  accent: string;
  accentSoft: string;
  brand: string;
  brandPressed: string;
  onBrand: string;
  ok: string;
  okBg: string;
  okLine: string;
  warn: string;
  warnBg: string;
  warnLine: string;
  danger: string;
  dangerBg: string;
  dangerLine: string;
  highlight: string;
  ink: string;
  inkRaised: string;
  onInk: string;
  onInkMuted: string;
  inkLine: string;
  scrim: string;
}

const light: ColorTokens = {
  bg: palette.asphalt[50],
  bgRaised: '#ffffff',
  bgSunken: palette.asphalt[100],
  fg: palette.asphalt[950],
  fgMuted: palette.asphalt[600],
  fgSubtle: palette.asphalt[500],
  line: palette.asphalt[200],
  lineStrong: palette.asphalt[300],
  accent: palette.signal[600],
  accentSoft: 'rgba(31, 70, 224, 0.08)',
  brand: palette.signal[600],
  brandPressed: palette.signal[700],
  onBrand: '#ffffff',
  ok: '#15803d',
  okBg: '#dcfce7',
  okLine: 'rgba(21, 128, 61, 0.2)',
  // Ambre 700 et non le jaune des marquages : sur fond pâle, le jaune tombait à
  // 2,3:1 de contraste, loin des 4,5:1 exigés pour du texte.
  warn: '#a16207',
  warnBg: '#fef3c7',
  warnLine: 'rgba(161, 98, 7, 0.25)',
  danger: '#b91c1c',
  dangerBg: '#fee2e2',
  dangerLine: 'rgba(185, 28, 28, 0.25)',
  highlight: palette.marking[400],
  ink: palette.asphalt[950],
  inkRaised: '#151924',
  onInk: '#f4f5f8',
  onInkMuted: '#a9b2c5',
  inkLine: 'rgba(255, 255, 255, 0.09)',
  scrim: 'rgba(11, 13, 18, 0.6)',
};

const dark: ColorTokens = {
  bg: palette.asphalt[950],
  bgRaised: palette.asphalt[900],
  bgSunken: '#0f1218',
  fg: palette.asphalt[50],
  fgMuted: palette.asphalt[300],
  fgSubtle: palette.asphalt[400],
  line: palette.asphalt[800],
  lineStrong: '#323949',
  accent: '#7fa3ff',
  accentSoft: 'rgba(127, 163, 255, 0.1)',
  brand: palette.signal[500],
  brandPressed: '#5078ff',
  onBrand: '#ffffff',
  ok: '#4ade80',
  okBg: '#0c2c1a',
  okLine: 'rgba(74, 222, 128, 0.2)',
  warn: palette.marking[400],
  warnBg: '#2f2408',
  warnLine: 'rgba(255, 210, 63, 0.25)',
  danger: '#fca5a5',
  dangerBg: '#3a1417',
  dangerLine: 'rgba(252, 165, 165, 0.25)',
  highlight: palette.marking[400],
  // L'encre ne change pas avec le thème : c'est une matière, pas un fond.
  ink: '#07080c',
  inkRaised: '#10131b',
  onInk: '#f4f5f8',
  onInkMuted: '#a9b2c5',
  inkLine: 'rgba(255, 255, 255, 0.09)',
  scrim: 'rgba(0, 0, 0, 0.7)',
};

export const colorsFor = (scheme: 'light' | 'dark'): ColorTokens =>
  scheme === 'dark' ? dark : light;

/** Les ombres du site, en `boxShadow` natif (nouvelle architecture). */
export interface ShadowTokens {
  panel: string;
  lift: string;
  float: string;
  brand: string;
}

export const shadowsFor = (scheme: 'light' | 'dark'): ShadowTokens =>
  scheme === 'dark'
    ? {
        panel: '0px 1px 2px rgba(0, 0, 0, 0.5)',
        lift: '0px 18px 40px -18px rgba(0, 0, 0, 0.8)',
        float: '0px 30px 60px -24px rgba(0, 0, 0, 0.9)',
        brand: '0px 10px 28px -10px rgba(58, 100, 248, 0.8)',
      }
    : {
        panel: '0px 1px 2px rgba(11, 13, 18, 0.05), 0px 1px 3px rgba(11, 13, 18, 0.04)',
        lift: '0px 18px 40px -18px rgba(11, 13, 18, 0.28), 0px 4px 10px -4px rgba(11, 13, 18, 0.08)',
        float: '0px 30px 60px -24px rgba(11, 13, 18, 0.45), 0px 10px 20px -10px rgba(11, 13, 18, 0.2)',
        brand: '0px 10px 24px -10px rgba(31, 70, 224, 0.65)',
      };

/**
 * Bricolage Grotesque pour la voix, Geist pour le texte, Geist Mono pour les
 * chiffres et les étiquettes « ticket d'horodateur ». Chaque graisse est une
 * famille à part en React Native : le nom sert de clé au chargement.
 */
export const fonts = {
  display: {
    semibold: 'BricolageGrotesque_600SemiBold',
    bold: 'BricolageGrotesque_700Bold',
    extrabold: 'BricolageGrotesque_800ExtraBold',
  },
  sans: {
    regular: 'Geist_400Regular',
    medium: 'Geist_500Medium',
    semibold: 'Geist_600SemiBold',
    bold: 'Geist_700Bold',
  },
  mono: {
    medium: 'GeistMono_500Medium',
    semibold: 'GeistMono_600SemiBold',
    bold: 'GeistMono_700Bold',
  },
} as const;

export const radii = { sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, pill: 999 } as const;

export const gutter = 16;
