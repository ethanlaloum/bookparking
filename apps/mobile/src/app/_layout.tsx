import '../lib/i18n';

import { BricolageGrotesque_600SemiBold } from '@expo-google-fonts/bricolage-grotesque/600SemiBold';
import { BricolageGrotesque_700Bold } from '@expo-google-fonts/bricolage-grotesque/700Bold';
import { BricolageGrotesque_800ExtraBold } from '@expo-google-fonts/bricolage-grotesque/800ExtraBold';
import { Geist_400Regular } from '@expo-google-fonts/geist/400Regular';
import { Geist_500Medium } from '@expo-google-fonts/geist/500Medium';
import { Geist_600SemiBold } from '@expo-google-fonts/geist/600SemiBold';
import { Geist_700Bold } from '@expo-google-fonts/geist/700Bold';
import { GeistMono_500Medium } from '@expo-google-fonts/geist-mono/500Medium';
import { GeistMono_600SemiBold } from '@expo-google-fonts/geist-mono/600SemiBold';
import { GeistMono_700Bold } from '@expo-google-fonts/geist-mono/700Bold';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';

import { resolveApiBaseUrl } from '../lib/apiBaseUrl';
import { createMobileStore } from '../store/createMobileStore';
import { useTheme } from '../theme/useTheme';

void SplashScreen.preventAutoHideAsync();

/**
 * Les polices sont embarquées dans l'app, là où le site les demande à Google
 * après accord : aucune requête vers un tiers, donc rien à consentir. Tant
 * qu'elles ne sont pas chargées, l'écran de démarrage reste affiché — un titre
 * qui bascule de police au premier rendu se remarque plus sur un téléphone.
 */
export default function RootLayout() {
  const [store] = useState(() => createMobileStore(resolveApiBaseUrl()));
  const [fontsLoaded, fontError] = useFonts({
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    Geist_700Bold,
    GeistMono_500Medium,
    GeistMono_600SemiBold,
    GeistMono_700Bold,
  });

  const ready = fontsLoaded || fontError !== null;

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <Navigation />
      </Provider>
    </GestureHandlerRootView>
  );
}

const Navigation = () => {
  const { scheme, colors } = useTheme();
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <ThemeProvider
      value={{
        ...base,
        colors: {
          ...base.colors,
          primary: colors.brand,
          background: colors.bg,
          card: colors.bgRaised,
          text: colors.fg,
          border: colors.line,
          notification: colors.brand,
        },
      }}
    >
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="place/[id]" />
        <Stack.Screen name="paiement/[requestId]" options={{ gestureEnabled: false }} />
        <Stack.Screen name="publier" options={{ presentation: 'modal' }} />
        <Stack.Screen name="connexion" options={{ presentation: 'modal' }} />
        <Stack.Screen name="inscription" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
};
