import { Text as NativeText, type TextProps, type TextStyle } from 'react-native';

import { fonts } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';

type Tone = 'fg' | 'muted' | 'subtle' | 'accent' | 'onInk' | 'onInkMuted' | 'onBrand' | 'ok' | 'warn' | 'danger' | 'highlight';

interface Props extends TextProps {
  tone?: Tone;
  size?: number;
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  /** Chiffres alignés : montants, dates, compteurs. */
  tabular?: boolean;
  center?: boolean;
}

const toneColor = (tone: Tone, colors: ReturnType<typeof useTheme>['colors']): string =>
  ({
    fg: colors.fg,
    muted: colors.fgMuted,
    subtle: colors.fgSubtle,
    accent: colors.accent,
    onInk: colors.onInk,
    onInkMuted: colors.onInkMuted,
    onBrand: colors.onBrand,
    ok: colors.ok,
    warn: colors.warn,
    danger: colors.danger,
    highlight: colors.highlight,
  })[tone];

const tabularStyle: TextStyle = { fontVariant: ['tabular-nums'] };

/** Le texte courant : Geist, 16 px, interligne 1,5 — le `body` du site. */
export const Text = ({
  tone = 'fg',
  size = 16,
  weight = 'regular',
  tabular = false,
  center = false,
  style,
  ...props
}: Props) => {
  const { colors } = useTheme();
  return (
    <NativeText
      {...props}
      style={[
        {
          color: toneColor(tone, colors),
          fontFamily: fonts.sans[weight],
          fontSize: size,
          lineHeight: Math.round(size * 1.5),
        },
        tabular && tabularStyle,
        center && { textAlign: 'center' },
        style,
      ]}
    />
  );
};

interface DisplayProps extends Omit<Props, 'weight'> {
  weight?: 'semibold' | 'bold' | 'extrabold';
  /** Interligne relatif, 1,05 par défaut : les titres du site sont serrés. */
  leading?: number;
}

/**
 * Les titres : Bricolage Grotesque, crénage resserré de 0,025 em comme les
 * `h1…h4` du site. Au-delà de 40 px, le site serre jusqu'à 0,045 em.
 */
export const Display = ({
  tone = 'fg',
  size = 28,
  weight = 'bold',
  leading = 1.05,
  tabular = false,
  center = false,
  style,
  ...props
}: DisplayProps) => {
  const { colors } = useTheme();
  const tracking = size >= 40 ? -0.045 : size >= 28 ? -0.035 : -0.025;
  return (
    <NativeText
      accessibilityRole="header"
      {...props}
      style={[
        {
          color: toneColor(tone, colors),
          fontFamily: fonts.display[weight],
          fontSize: size,
          lineHeight: Math.round(size * leading),
          letterSpacing: size * tracking,
        },
        tabular && tabularStyle,
        center && { textAlign: 'center' },
        style,
      ]}
    />
  );
};

/**
 * L'étiquette « ticket d'horodateur » : petite capitale en chasse fixe,
 * espacée de 0,14 em. Le texte reste en casse normale dans l'arbre
 * d'accessibilité : c'est le style qui le met en capitales, comme sur le site.
 */
export const Ticket = ({ tone = 'subtle', size = 11, style, ...props }: Omit<Props, 'weight'>) => {
  const { colors } = useTheme();
  return (
    <NativeText
      {...props}
      style={[
        {
          color: toneColor(tone, colors),
          fontFamily: fonts.mono.medium,
          fontSize: size,
          lineHeight: Math.round(size * 1.35),
          letterSpacing: size * 0.14,
          textTransform: 'uppercase',
        },
        style,
      ]}
    />
  );
};
