export class PlatformSettingsUnchangedError extends Error {
  protected readonly _tag = 'PlatformSettingsUnchangedError';
  constructor() {
    super('Aucun réglage n’a changé : il n’y a rien à enregistrer');
  }
}
