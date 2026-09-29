import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enAdmin from './locales/en-US/admin.json';
import enAuth from './locales/en-US/auth.json';
import enCommon from './locales/en-US/common.json';
import frAdmin from './locales/fr/admin.json';
import frAuth from './locales/fr/auth.json';
import frCommon from './locales/fr/common.json';

export const NAMESPACES = ['common', 'auth', 'admin'] as const;

const resources = {
  fr: { common: frCommon, auth: frAuth, admin: frAdmin },
  'en-US': { common: enCommon, auth: enAuth, admin: enAdmin },
};

void i18n.use(initReactI18next).init({
  resources,
  lng: 'fr',
  fallbackLng: 'fr',
  supportedLngs: ['fr', 'en-US'],
  ns: NAMESPACES,
  defaultNS: 'common',
  interpolation: { escapeValue: false },
});

export { i18n };
