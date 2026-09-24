// Hermes n'expose pas toujours `Intl.PluralRules`, dont i18next a besoin pour
// choisir entre `_one` et `_other` : sans lui, « 1 nuits ». Le polyfill ne
// s'installe que s'il manque.
import 'intl-pluralrules';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Les textes sont ceux du site, namespace par namespace : un libellé renommé
// là-bas l'est ici aussi. Seul `mobile` porte ce qui n'existe que dans l'app.
import enAccount from '@front/lib/i18n/locales/en-US/account.json';
import enAuth from '@front/lib/i18n/locales/en-US/auth.json';
import enCommon from '@front/lib/i18n/locales/en-US/common.json';
import enListing from '@front/lib/i18n/locales/en-US/listing.json';
import enRental from '@front/lib/i18n/locales/en-US/rental.json';
import frAccount from '@front/lib/i18n/locales/fr/account.json';
import frAuth from '@front/lib/i18n/locales/fr/auth.json';
import frCommon from '@front/lib/i18n/locales/fr/common.json';
import frListing from '@front/lib/i18n/locales/fr/listing.json';
import frRental from '@front/lib/i18n/locales/fr/rental.json';

import enMobile from '../locales/en-US/mobile.json';
import frMobile from '../locales/fr/mobile.json';

export const NAMESPACES = ['common', 'auth', 'listing', 'rental', 'account', 'mobile'] as const;

void i18n.use(initReactI18next).init({
  resources: {
    fr: { common: frCommon, auth: frAuth, listing: frListing, rental: frRental, account: frAccount, mobile: frMobile },
    'en-US': { common: enCommon, auth: enAuth, listing: enListing, rental: enRental, account: enAccount, mobile: enMobile },
  },
  lng: 'fr',
  fallbackLng: 'fr',
  supportedLngs: ['fr', 'en-US'],
  ns: NAMESPACES,
  defaultNS: 'common',
  interpolation: { escapeValue: false },
});

export { i18n };
