import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { passwordGaugeOf, passwordStrengthOf } from '@front/app/account/domain/entities/Password';

import { useTheme } from '../theme/useTheme';
import { Text } from './ui/Text';

/** La jauge de SPEC-007 RG-02, jugée par la même règle que le site. */
export const PasswordStrengthMeter = ({ password }: { password: string }) => {
  const { t } = useTranslation('auth');
  const { colors } = useTheme();
  if (password === '') return null;

  const strength = passwordStrengthOf(password);
  const gauge = passwordGaugeOf(strength);
  const label = t(`strength.${strength}`);

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={t('strength.label')}
      accessibilityValue={{ min: 0, max: 3, now: gauge.segments, text: label }}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
    >
      <View style={{ flex: 1, flexDirection: 'row', gap: 6 }}>
        {[1, 2, 3].map((segment) => (
          <View
            key={segment}
            style={{
              flex: 1,
              height: 6,
              borderRadius: 3,
              backgroundColor: segment <= gauge.segments ? colors[gauge.tone] : colors.line,
            }}
          />
        ))}
      </View>
      <Text size={12} weight="medium" tone={gauge.tone} style={{ minWidth: 64, textAlign: 'right' }}>
        {label}
      </Text>
    </View>
  );
};
