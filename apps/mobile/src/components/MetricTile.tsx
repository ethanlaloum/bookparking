import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { palette } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { Display, Text, Ticket } from './ui/Text';

interface MetricTileProps {
  icon: LucideIcon;
  label: string;
  value: string;
  hint: string;
  tone?: 'plain' | 'accent';
}

/**
 * La tuile de métrique du tableau de bord. `accessible` + `accessibilityLabel`
 * jouent le rôle du `role="group"` du site : VoiceOver lit le libellé et la
 * valeur ensemble, au lieu de deux textes voisins. La tuile d'accent reste en
 * bleu panneau dans les deux thèmes — le bleu clair du sombre ne porterait pas
 * un blanc atténué à 4,5:1.
 */
export const MetricTile = ({ icon: Icon, label, value, hint, tone = 'plain' }: MetricTileProps) => {
  const { colors, shadows } = useTheme();
  const accent = tone === 'accent';

  return (
    <View
      accessible
      accessibilityLabel={`${label} : ${value}. ${hint}`}
      style={{
        flex: 1,
        minHeight: 168,
        gap: 10,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: accent ? 'transparent' : colors.line,
        backgroundColor: accent ? palette.signal[600] : colors.bgRaised,
        boxShadow: accent ? shadows.brand : undefined,
        padding: 16,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, minHeight: 36 }}>
        <Ticket style={{ flex: 1, color: accent ? 'rgba(255,255,255,0.85)' : colors.fgMuted }}>{label}</Ticket>
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: accent ? 'rgba(255,255,255,0.15)' : colors.bgSunken,
          }}
        >
          <Icon size={17} color={accent ? '#ffffff' : colors.fgMuted} />
        </View>
      </View>
      <Display size={32} weight="bold" tabular style={{ color: accent ? '#ffffff' : colors.fg }}>
        {value}
      </Display>
      <Text size={12} style={{ marginTop: 'auto', lineHeight: 16, color: accent ? 'rgba(255,255,255,0.85)' : colors.fgSubtle }}>
        {hint}
      </Text>
    </View>
  );
};
