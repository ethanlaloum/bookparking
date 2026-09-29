import { createAction } from '@reduxjs/toolkit';

// Le bandeau et le pied de page ouvrent le même panneau : l'état « ouvert »
// vit donc dans le store, pas dans l'un des deux composants. Ouvrir ou fermer
// ne décide rien — seul `recordConsentRequested` écrit une décision.
export const consentSettingsOpened = createAction('consent/settingsOpened');
export const consentSettingsClosed = createAction('consent/settingsClosed');
