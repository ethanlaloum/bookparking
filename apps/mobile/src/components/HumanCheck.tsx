import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';

import { useTheme } from '../theme/useTheme';
import { Text } from './ui/Text';

/** Où en est la preuve anti-robot de SPEC-007 RG-03 : rien à cocher. */
export const HumanCheck = ({ ready, failed }: { ready: boolean; failed: boolean }) => {
  const { t } = useTranslation('auth');
  const { colors } = useTheme();

  return (
    <View
      accessibilityLiveRegion="polite"
      style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
    >
      {!ready && !failed && <ActivityIndicator size="small" color={colors.fgMuted} />}
      <Text size={14} tone={ready ? 'ok' : failed ? 'danger' : 'muted'}>
        {ready ? `✓ ${t('human.ready')}` : failed ? t('human.failed') : t('human.pending')}
      </Text>
    </View>
  );
};
