import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { AVATARS, type Avatar as AvatarId } from '@front/app/account/domain/entities/Avatar';

import { useTheme } from '../theme/useTheme';
import { Avatar } from './Avatar';
import { Text } from './ui/Text';

/**
 * Les cinq pilotes du site, en vignettes à toucher : un groupe de boutons
 * radio, chaque option nommée par son pilote.
 */
export const AvatarPicker = ({
  value,
  onChange,
  disabled = false,
}: {
  value: AvatarId;
  onChange: (avatar: AvatarId) => void;
  disabled?: boolean;
}) => {
  const { t } = useTranslation('common');
  const { colors } = useTheme();

  return (
    <View style={{ gap: 8 }}>
      <Text size={14} weight="medium">
        {t('common:avatar.label')}
      </Text>
      <View accessibilityRole="radiogroup" accessibilityLabel={t('common:avatar.label')} style={{ flexDirection: 'row', gap: 6 }}>
        {AVATARS.map((avatar) => {
          const selected = value === avatar;
          const name = t(`common:avatar.name.${avatar}`);
          return (
            <Pressable
              key={avatar}
              accessibilityRole="radio"
              accessibilityLabel={name}
              accessibilityState={{ checked: selected, disabled }}
              disabled={disabled}
              onPress={() => {
                if (selected) return;
                void Haptics.selectionAsync();
                onChange(avatar);
              }}
              style={{
                flex: 1,
                alignItems: 'center',
                gap: 6,
                paddingVertical: 8,
                paddingHorizontal: 2,
                borderRadius: 16,
                borderWidth: 1.5,
                borderColor: selected ? colors.brand : colors.line,
                backgroundColor: selected ? colors.accentSoft : colors.bgRaised,
                opacity: disabled ? 0.6 : 1,
              }}
            >
              <Avatar avatar={avatar} size={46} />
              <Text size={11} weight={selected ? 'semibold' : 'medium'} tone={selected ? 'fg' : 'muted'} numberOfLines={1}>
                {name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};
