import { MapPin, Search, X } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Modal, Pressable, TextInput, View } from 'react-native';

import type { AddressSuggestion } from '@front/app/listing/domain/entities/Coordinates';
import {
  addressQueryChanged,
  MINIMUM_QUERY_LENGTH,
} from '@front/app/listing/domain/use-cases/search-address/searchAddressEpic';
import { selectAddressSuggestions } from '@front/selectors/listing/listingSelectors';

import { useAppDispatch, useAppSelector } from '../store/redux';
import { fonts } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';
import { Display, Text } from './ui/Text';

interface AddressSheetProps {
  visible: boolean;
  initialQuery: string;
  onSelect: (suggestion: AddressSuggestion) => void;
  onClose: () => void;
}

/**
 * La recherche d'adresse, en plein écran : sur un téléphone, une liste de
 * suggestions sous un champ n'a pas la place de s'ouvrir au-dessus du clavier.
 * La frappe part dans `addressQueryChanged` — le même epic que le site, avec
 * son `debounceTime` et son `switchMap` : la dernière frappe gagne. La Base
 * Adresse Nationale n'est appelée que parce que l'utilisateur tape une
 * adresse ; c'est le service qu'il demande, rien à consentir.
 */
export const AddressSheet = ({ visible, initialQuery, onSelect, onClose }: AddressSheetProps) => {
  const { t } = useTranslation(['listing', 'common', 'mobile']);
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const suggestions = useAppSelector(selectAddressSuggestions);
  const [query, setQuery] = useState(initialQuery);
  const input = useRef<TextInput>(null);

  const change = (next: string): void => {
    setQuery(next);
    dispatch(addressQueryChanged({ query: next }));
  };

  const long = query.trim().length >= MINIMUM_QUERY_LENGTH;
  const shown = long ? suggestions : [];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      onShow={() => {
        setQuery(initialQuery);
        dispatch(addressQueryChanged({ query: initialQuery }));
        input.current?.focus();
      }}
    >
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingBottom: 14 }}>
          <Display size={24}>{t('mobile:search.field')}</Display>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common:action.close')}
            onPress={onClose}
            hitSlop={10}
            style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgSunken }}
          >
            <X size={18} color={colors.fg} />
          </Pressable>
        </View>

        <View
          style={{
            marginHorizontal: 20,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            minHeight: 52,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: colors.accent,
            backgroundColor: colors.bgRaised,
            paddingHorizontal: 14,
            boxShadow: `0px 0px 0px 3px ${colors.accentSoft}`,
          }}
        >
          <Search size={18} color={colors.fgSubtle} />
          <TextInput
            ref={input}
            value={query}
            onChangeText={change}
            accessibilityLabel={t('listing:mapSearch.label')}
            accessibilityHint={t('listing:mapSearch.hint')}
            placeholder={t('listing:mapSearch.placeholder')}
            placeholderTextColor={colors.fgSubtle}
            selectionColor={colors.accent}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            style={{ flex: 1, color: colors.fg, fontFamily: fonts.sans.regular, fontSize: 16, paddingVertical: 12 }}
          />
          {query !== '' && (
            <Pressable accessibilityRole="button" accessibilityLabel={t('listing:mapSearch.clear')} onPress={() => change('')} hitSlop={10}>
              <X size={16} color={colors.fgSubtle} />
            </Pressable>
          )}
        </View>
        <Text size={12} tone="subtle" style={{ marginHorizontal: 20, marginTop: 8 }}>
          {t('listing:mapSearch.hint')}
        </Text>

        <FlatList
          data={shown}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          accessibilityLabel={t('listing:mapSearch.suggestions')}
          contentContainerStyle={{ padding: 20, paddingTop: 16, gap: 6 }}
          ListEmptyComponent={
            long ? (
              <Text size={14} tone="muted" style={{ paddingVertical: 8 }}>
                {t('listing:mapSearch.noResult')}
              </Text>
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={item.label}
              onPress={() => onSelect(item)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 12,
                backgroundColor: pressed ? colors.accentSoft : colors.bgRaised,
                borderWidth: 1,
                borderColor: colors.line,
              })}
            >
              <View style={{ width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentSoft }}>
                <MapPin size={16} color={colors.accent} />
              </View>
              <Text size={15} style={{ flex: 1 }}>
                {item.label}
              </Text>
            </Pressable>
          )}
        />
      </View>
    </Modal>
  );
};
