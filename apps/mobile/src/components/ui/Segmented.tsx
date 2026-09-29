import * as Haptics from 'expo-haptics';
import { Pressable, ScrollView, View } from 'react-native';

import { fonts } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';
import { Text } from './Text';

interface SegmentedProps<T extends string> {
  label: string;
  options: readonly { value: T; label: string; badge?: number }[];
  value: T;
  onChange: (value: T) => void;
  /** Défile à l'horizontale quand les onglets ne tiennent pas sur la largeur. */
  scrollable?: boolean;
}

/**
 * Les onglets du tableau de bord du site : un rail creux, et l'onglet choisi
 * en carte blanche soulevée. Chaque segment est un `tab` pour VoiceOver.
 */
export const Segmented = <T extends string>({ label, options, value, onChange, scrollable = false }: SegmentedProps<T>) => {
  const { colors, shadows } = useTheme();

  const items = options.map((option) => {
    const selected = option.value === value;
    return (
      <Pressable
        key={option.value}
        accessibilityRole="tab"
        accessibilityState={{ selected }}
        accessibilityLabel={option.label}
        onPress={() => {
          if (selected) return;
          void Haptics.selectionAsync();
          onChange(option.value);
        }}
        style={{
          flexGrow: scrollable ? 0 : 1,
          minHeight: 38,
          paddingHorizontal: 14,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 6,
          backgroundColor: selected ? colors.bgRaised : 'transparent',
          borderWidth: selected ? 1 : 0,
          borderColor: colors.lineStrong,
          boxShadow: selected ? shadows.panel : undefined,
        }}
      >
        <Text
          numberOfLines={1}
          style={{
            fontFamily: selected ? fonts.sans.semibold : fonts.sans.medium,
            fontSize: 14,
            lineHeight: 18,
            color: selected ? colors.fg : colors.fgMuted,
          }}
        >
          {option.label}
        </Text>
        {option.badge !== undefined && option.badge > 0 && (
          <View
            style={{
              minWidth: 18,
              height: 18,
              borderRadius: 9,
              paddingHorizontal: 5,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.brand,
            }}
          >
            <Text style={{ fontFamily: fonts.sans.semibold, fontSize: 11, lineHeight: 13, color: colors.onBrand }}>
              {String(option.badge)}
            </Text>
          </View>
        )}
      </Pressable>
    );
  });

  const rail = {
    flexDirection: 'row' as const,
    gap: 4,
    padding: 4,
    borderRadius: 16,
    backgroundColor: colors.bgSunken,
    borderWidth: 1,
    borderColor: colors.line,
  };

  if (scrollable)
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        accessibilityRole="tablist"
        accessibilityLabel={label}
        contentContainerStyle={rail}
        style={{ flexGrow: 0 }}
      >
        {items}
      </ScrollView>
    );

  return (
    <View accessibilityRole="tablist" accessibilityLabel={label} style={rail}>
      {items}
    </View>
  );
};
