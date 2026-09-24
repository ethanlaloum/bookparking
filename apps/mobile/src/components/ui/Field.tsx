import { CircleAlert } from 'lucide-react-native';
import { forwardRef, useState } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';

import { fonts } from '../../theme/tokens';
import { useTheme } from '../../theme/useTheme';
import { Text } from './Text';

interface FieldProps extends TextInputProps {
  label: string;
  hint?: string;
  error?: string;
  multiline?: boolean;
}

/**
 * Un libellé, une entrée, son aide ou son erreur — le `Field` du site. Le
 * contour n'est pas supprimé au focus : la bordure passe à l'accent et un halo
 * de trois points l'entoure, sans quoi un champ actif ne se distinguerait d'un
 * autre que par une nuance.
 */
export const Field = forwardRef<TextInput, FieldProps>(function Field(
  { label, hint, error, multiline = false, style, onFocus, onBlur, ...props },
  ref,
) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const invalid = error !== undefined;

  return (
    <View style={{ gap: 8 }}>
      <Text size={14} weight="medium">
        {label}
      </Text>
      <TextInput
        ref={ref}
        accessibilityLabel={label}
        accessibilityHint={error ?? hint}
        placeholderTextColor={colors.fgSubtle}
        selectionColor={colors.accent}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        {...props}
        style={[
          {
            minHeight: multiline ? 112 : 48,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: invalid ? colors.danger : focused ? colors.accent : colors.lineStrong,
            backgroundColor: colors.bgRaised,
            paddingHorizontal: 14,
            paddingVertical: multiline ? 12 : 0,
            color: colors.fg,
            fontFamily: fonts.sans.regular,
            fontSize: 16,
            boxShadow: focused
              ? `0px 0px 0px 3px ${invalid ? colors.dangerLine : colors.accentSoft}`
              : undefined,
          },
          style,
        ]}
      />
      {hint !== undefined && !invalid && (
        <Text size={12} tone="subtle">
          {hint}
        </Text>
      )}
      {invalid && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <CircleAlert size={14} color={colors.danger} />
          <Text size={12} weight="medium" tone="danger" style={{ flex: 1 }}>
            {error}
          </Text>
        </View>
      )}
    </View>
  );
});
