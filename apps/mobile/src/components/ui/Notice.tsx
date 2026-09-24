import { CircleCheck, Info, TriangleAlert } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useTheme } from '../../theme/useTheme';
import { Text } from './Text';

interface NoticeProps {
  tone: 'error' | 'success' | 'info';
  title?: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Le bandeau du site : pastille d'icône, titre en gras, texte. Une erreur est
 * annoncée tout de suite (`accessibilityLiveRegion` / rôle `alert`), sinon un
 * lecteur d'écran resterait sur le bouton sans apprendre pourquoi rien ne
 * s'est passé.
 */
export const Notice = ({ tone, title, children, style }: NoticeProps) => {
  const { colors } = useTheme();
  const look = {
    error: { icon: TriangleAlert, bg: colors.dangerBg, fg: colors.danger, line: colors.dangerLine, chip: colors.dangerLine },
    success: { icon: CircleCheck, bg: colors.okBg, fg: colors.ok, line: colors.okLine, chip: colors.okLine },
    info: { icon: Info, bg: colors.bgRaised, fg: colors.fgMuted, line: colors.line, chip: colors.accentSoft },
  }[tone];
  const Icon = look.icon;

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      accessibilityRole={tone === 'error' ? 'alert' : 'summary'}
      accessibilityLiveRegion={tone === 'error' ? 'assertive' : 'polite'}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 12,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: look.line,
          backgroundColor: look.bg,
          paddingHorizontal: 14,
          paddingVertical: 12,
        },
        style,
      ]}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 8,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: look.chip,
        }}
      >
        <Icon size={14} color={tone === 'info' ? colors.accent : look.fg} />
      </View>
      <View style={{ flex: 1, paddingTop: 2 }}>
        {title !== undefined && (
          <Text size={14} weight="semibold" style={{ color: look.fg }}>
            {title}
          </Text>
        )}
        <Text size={14} style={{ color: look.fg, marginTop: title === undefined ? 0 : 2 }}>
          {children}
        </Text>
      </View>
    </Animated.View>
  );
};
