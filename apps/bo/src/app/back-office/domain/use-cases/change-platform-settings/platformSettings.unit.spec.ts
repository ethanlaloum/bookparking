import { describe, it } from 'vitest';

import { createPlatformSettingsSut } from './platformSettings.sut';

const NEW_TERMS = {
  platformFeePercent: 12.5,
  freeCancellationHours: 48,
  requestExpiryHours: 24,
  payoutReleaseDelayHours: 72,
};
const REASON = 'Commission alignée sur le marché niçois';

describe('the rental settings of the site', () => {
  it('shows the values in force and the bounds the api enforces', () => {
    const sut = createPlatformSettingsSut();
    const form = sut.aPlatformSettingsForm({ platformFeePercent: 12.5 });
    sut.givenTheApiHolds(form);

    sut.whenReadingTheSettings();

    sut.thenTheFormShownIs(form);
    sut.thenTheAccessIs('granted');
  });

  it('sends the new values with the reason, then rereads the settings and the journal once', () => {
    const sut = createPlatformSettingsSut();

    sut.whenChanging(NEW_TERMS, REASON);

    sut.thenTheApiWasAskedTo([{ settings: NEW_TERMS, reason: REASON }]);
    sut.thenItSucceeded(true);
    sut.thenTheRereadsAre({ settings: 1, journal: 1 });
  });

  it("shows the api refusal and rereads nothing", () => {
    const sut = createPlatformSettingsSut();
    sut.givenTheApiRejectsWith(
      'refused',
      'Le délai de réponse du loueur doit être un nombre entier d’heures, entre 1 et 96',
    );

    sut.whenChanging({ ...NEW_TERMS, requestExpiryHours: 97 }, REASON);

    sut.thenItSucceeded(false);
    sut.thenTheErrorShownIs(
      'Le délai de réponse du loueur doit être un nombre entier d’heures, entre 1 et 96',
    );
    sut.thenTheRereadsAre({ settings: 0, journal: 0 });
  });

  it('closes the console when the api says this account no longer administers the site', () => {
    const sut = createPlatformSettingsSut();
    sut.givenTheApiRejectsWith('forbidden', "Cette action est réservée à l'administration du site");

    sut.whenChanging(NEW_TERMS, REASON);

    sut.thenTheAccessIs('denied');
  });
});

describe('the administration journal', () => {
  it('filters moderations from settings changes, keeping the order of the api', () => {
    const sut = createPlatformSettingsSut();
    sut.givenTheJournalHolds([
      sut.aJournalEntry({
        id: 'settings',
        kind: 'CHANGE_PLATFORM_SETTINGS',
        targetType: 'PLATFORM_SETTINGS',
      }),
      sut.aJournalEntry({ id: 'suspension', kind: 'SUSPEND_ACCOUNT' }),
      sut.aJournalEntry({ id: 'unpublication', kind: 'UNPUBLISH_LISTING', targetType: 'LISTING' }),
    ]);

    sut.whenReadingTheJournal();

    sut.thenTheJournalShownIs('all', ['settings', 'suspension', 'unpublication']);
    sut.thenTheJournalShownIs('moderation', ['suspension', 'unpublication']);
    sut.thenTheJournalShownIs('settings', ['settings']);
  });
});
