import { KeyRound } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useTheme } from '../theme/useTheme';
import { Text, Ticket } from './ui/Text';

/**
 * Les consignes du loueur, comme sur le site : un ticket vert à part, pour les
 * retrouver d'un coup d'œil devant le portail. Le texte est sélectionnable —
 * un appui long le copie, sans module natif de plus.
 */
export const AccessInstructions = ({ instructions }: { instructions: string }) => {
  const { t } = useTranslation('account');
  const { colors } = useTheme();

  return (
    <View
      accessibilityLabel={t('access.title')}
      style={{
        flexDirection: 'row',
        gap: 12,
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.okLine,
        backgroundColor: colors.okBg,
      }}
    >
      <View style={{ width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgRaised }}>
        <KeyRound size={16} color={colors.ok} />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Ticket tone="ok">{t('access.title')}</Ticket>
        <Text size={15} weight="medium" selectable>
          {instructions}
        </Text>
        <Text size={12} tone="muted">
          {t('access.hint')}
        </Text>
      </View>
    </View>
  );
};
