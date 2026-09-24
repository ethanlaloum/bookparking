import { View, type ViewProps } from 'react-native';

import { radii } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';

interface CardProps extends ViewProps {
  /** L'ombre qui soulève : réservée à ce qui se pose au-dessus du reste. */
  lifted?: boolean;
  padded?: boolean;
}

/** `rounded-2xl border border-line bg-bg-raised shadow-panel` — la carte du site. */
export const Card = ({ lifted = false, padded = true, style, ...props }: CardProps) => {
  const { colors, shadows } = useTheme();
  return (
    <View
      {...props}
      style={[
        {
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: colors.line,
          backgroundColor: colors.bgRaised,
          boxShadow: lifted ? shadows.lift : shadows.panel,
          padding: padded ? 20 : 0,
        },
        style,
      ]}
    />
  );
};
