import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { selectUnreadNotificationCount } from '@front/selectors/notification/notificationSelectors';

import { useAppSelector } from '../store/redux';
import { fonts } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { Text } from './ui/Text';

/** La cloche du site, en tête des onglets : elle ouvre la feuille des notifications. */
export const NotificationBell = () => {
  const { t } = useTranslation('common');
  const { colors } = useTheme();
  const unreadCount = useAppSelector(selectUnreadNotificationCount);
  const label =
    unreadCount > 0 ? t('notification.bellUnread', { count: unreadCount }) : t('notification.bell');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={() => {
        void Haptics.selectionAsync();
        router.push('/notifications');
      }}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.line,
        backgroundColor: pressed ? colors.bgSunken : colors.bgRaised,
      })}
    >
      <Bell size={19} color={colors.fg} strokeWidth={2} />
      {unreadCount > 0 && (
        <View
          style={{
            position: 'absolute',
            top: -3,
            right: -3,
            minWidth: 19,
            height: 19,
            paddingHorizontal: 5,
            borderRadius: 999,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.danger,
            borderWidth: 2,
            borderColor: colors.bg,
          }}
        >
          <Text style={{ color: '#ffffff', fontFamily: fonts.sans.bold, fontSize: 10, lineHeight: 12 }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </Text>
        </View>
      )}
    </Pressable>
  );
};
