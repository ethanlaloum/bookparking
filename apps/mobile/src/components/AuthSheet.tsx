import { router } from 'expo-router';
import { Check, X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../theme/useTheme';
import { ParkingMark } from './art/Glyphs';
import { InkSurface } from './art/InkSurface';
import { Rise } from './ui/Layout';
import { Display, Text, Ticket } from './ui/Text';

const PROMISES = ['local', 'price', 'trust'] as const;

/**
 * Le cadre des écrans de connexion et d'inscription : la marque, un titre, le
 * formulaire, puis l'encre qui rappelle où l'on est et ce que le compte
 * permet — le panneau de droite du site, passé sous le formulaire.
 */
export const AuthSheet = ({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) => {
  const { t } = useTranslation(['listing', 'common']);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <ParkingMark size={44} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common:action.close')}
            onPress={() => router.back()}
            hitSlop={10}
            style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgSunken }}
          >
            <X size={18} color={colors.fg} />
          </Pressable>
        </View>

        <Rise style={{ marginTop: 28 }}>
          <Display size={36}>{title}</Display>
          <Text size={17} tone="muted" style={{ marginTop: 10 }}>
            {subtitle}
          </Text>
        </Rise>

        <Rise order={1} style={{ marginTop: 32, gap: 16 }}>
          {children}
        </Rise>

        <View style={{ marginTop: 28, paddingTop: 20, borderTopWidth: 1, borderTopColor: colors.line }}>{footer}</View>

        <InkSurface blueprint style={{ marginTop: 32, borderRadius: 24 }}>
          <View style={{ padding: 22 }}>
            <Ticket tone="highlight">{t('common:footer.city')}</Ticket>
            <Display size={22} weight="semibold" tone="onInk" style={{ marginTop: 10 }} leading={1.2}>
              {t('common:tagline')}
            </Display>
            <View style={{ marginTop: 16, gap: 10 }}>
              {PROMISES.map((key) => (
                <View key={key} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.highlight }}>
                    <Check size={12} strokeWidth={3} color="#0b0d12" />
                  </View>
                  <Text size={14} tone="onInkMuted">
                    {t(`listing:home.argument.${key}.title`)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </InkSurface>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
