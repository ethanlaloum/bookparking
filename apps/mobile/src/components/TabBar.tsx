import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { CalendarRange, House, Search, UserRound, type LucideIcon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fonts } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { Text } from './ui/Text';

const TABS: Record<string, { icon: LucideIcon; label: string }> = {
  index: { icon: House, label: 'mobile:tab.home' },
  recherche: { icon: Search, label: 'mobile:tab.search' },
  reservations: { icon: CalendarRange, label: 'mobile:tab.bookings' },
  compte: { icon: UserRound, label: 'mobile:tab.account' },
};

/**
 * La barre d'onglets reprend l'en-tête du site : fond translucide flouté,
 * filet bas de page, et l'onglet actif porté par une pastille — ici le bleu
 * panneau, comme le bouton « Publier une place ».
 */
export const TabBar = ({ state, navigation }: BottomTabBarProps) => {
  const { t } = useTranslation('mobile');
  const { scheme, colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        borderTopWidth: 1,
        borderTopColor: colors.line,
      }}
    >
      <BlurView
        tint={scheme === 'dark' ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'}
        intensity={80}
        style={{
          flexDirection: 'row',
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 10),
          paddingHorizontal: 10,
          gap: 4,
        }}
      >
        {state.routes.map((route, index) => {
          const tab = TABS[route.name];
          if (tab === undefined) return null;
          const focused = state.index === index;
          const Icon = tab.icon;
          const label = t(tab.label);

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) {
                  void Haptics.selectionAsync();
                  navigation.navigate(route.name, route.params);
                }
              }}
              style={{ flex: 1, alignItems: 'center', gap: 4 }}
            >
              <Animated.View
                style={{
                  height: 32,
                  width: 56,
                  borderRadius: 999,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: focused ? colors.brand : 'transparent',
                  boxShadow: focused ? '0px 8px 18px -8px rgba(31, 70, 224, 0.7)' : undefined,
                  transitionProperty: 'backgroundColor',
                  transitionDuration: 200,
                }}
              >
                <Icon size={18} color={focused ? colors.onBrand : colors.fgMuted} strokeWidth={focused ? 2.4 : 2} />
              </Animated.View>
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: focused ? fonts.sans.semibold : fonts.sans.medium,
                  fontSize: 11,
                  lineHeight: 14,
                  color: focused ? colors.fg : colors.fgMuted,
                }}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </BlurView>
    </View>
  );
};
