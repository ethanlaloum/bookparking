import { useColorScheme } from 'react-native';

import { colorsFor, shadowsFor, type ColorTokens, type ShadowTokens } from './tokens';

export interface Theme {
  scheme: 'light' | 'dark';
  colors: ColorTokens;
  shadows: ShadowTokens;
}

/** Le thème suit le réglage du téléphone, comme le site suit `prefers-color-scheme`. */
export const useTheme = (): Theme => {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return { scheme, colors: colorsFor(scheme), shadows: shadowsFor(scheme) };
};
