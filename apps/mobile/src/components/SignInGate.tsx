import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../theme/useTheme';
import { ParkingMark } from './art/Glyphs';
import { InkSurface } from './art/InkSurface';
import { Button } from './ui/Button';
import { Rise } from './ui/Layout';
import { Display, Text } from './ui/Text';

/** Ce qu'un onglet réservé montre à un visiteur : l'encre, une phrase, deux portes. */
export const SignInGate = ({ title, body }: { title: string; body: string }) => {
  const { t } = useTranslation('common');
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + 12, paddingHorizontal: 12 }}>
      <Rise>
        <InkSurface blueprint>
          <View style={{ padding: 24, paddingTop: 28, gap: 16 }}>
            <ParkingMark size={40} />
            <Display size={32} weight="extrabold" tone="onInk" style={{ marginTop: 8 }}>
              {title}
            </Display>
            <Text tone="onInkMuted" style={{ lineHeight: 24 }}>
              {body}
            </Text>
            <View style={{ gap: 10, marginTop: 10 }}>
              <Button variant="inverse" size="lg" label={t('nav.signIn')} onPress={() => router.push('/connexion')} />
              <Button variant="glass" size="lg" label={t('nav.register')} onPress={() => router.push('/inscription')} />
            </View>
          </View>
        </InkSurface>
      </Rise>
    </View>
  );
};
