import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enAccount from './locales/en-US/account.json';
import enAdmin from './locales/en-US/admin.json';
import enAuth from './locales/en-US/auth.json';
import enCommon from './locales/en-US/common.json';
import enConsent from './locales/en-US/consent.json';
import enListing from './locales/en-US/listing.json';
import enRental from './locales/en-US/rental.json';
import frAccount from './locales/fr/account.json';
import frAdmin from './locales/fr/admin.json';
import frAuth from './locales/fr/auth.json';
import frCommon from './locales/fr/common.json';
import frConsent from './locales/fr/consent.json';
import frListing from './locales/fr/listing.json';
import frRental from './locales/fr/rental.json';

export const NAMESPACES = ['common', 'auth', 'listing', 'rental', 'account', 'admin', 'consent'] as const;

const resources = {
  fr: {
    common: frCommon,
    auth: frAuth,
    listing: frListing,
    rental: frRental,
    account: frAccount,
    admin: frAdmin,
    consent: frConsent,
  },
  'en-US': {
    common: enCommon,
    auth: enAuth,
    listing: enListing,
    rental: enRental,
    account: enAccount,
    admin: enAdmin,
    consent: enConsent,
  },
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
