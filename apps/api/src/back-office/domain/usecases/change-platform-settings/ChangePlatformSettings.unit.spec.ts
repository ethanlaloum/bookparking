import { Either } from 'effect/index';

import {
  DEFAULT_PLATFORM_SETTINGS,
  PLATFORM_SETTINGS_BOUNDS,
} from '../../../../shared/platform-settings/domain/entities/PlatformSettings';
import { AdminActionKind, AdminTargetType } from '../../entities/AdminAction';
import { createPlatformSettingsSUT } from './ChangePlatformSettings.sut';

const AT = '2026-10-02T10:00:00.000Z';
const REASON = '  Commission alignée sur le marché niçois  ';
const NEW_TERMS = {
  platformFeePercent: 12.5,
  freeCancellationHours: 48,
  requestExpiryHours: 24,
  payoutReleaseDelayHours: 72,
};

describe('ChangePlatformSettings', () => {
  it('writes the new version and its journal line, with the trimmed reason', async () => {
    const sut = createPlatformSettingsSUT();

    const result = await sut.whenChangedBy(sut.admin, NEW_TERMS, REASON, AT);

    expect(result).toEqual(Either.right(undefined));
    sut.thenVersionsWritten([
      {
        settings: NEW_TERMS,
        change: {
          adminAccountId: sut.admin,
          reason: 'Commission alignée sur le marché niçois',
          at: new Date(AT),
        },
      },
    ]);
    sut.thenActionsRecorded([
      {
        adminAccountId: sut.admin,
        kind: AdminActionKind.CHANGE_PLATFORM_SETTINGS,
        targetType: AdminTargetType.PLATFORM_SETTINGS,
        targetId: sut.version,
        reason: 'Commission alignée sur le marché niçois',
        actedAt: new Date(AT),
      },
    ]);
    await sut.thenSettingsInForceAre(NEW_TERMS);
  });

  it('refuses an account that does not administer the site', async () => {
    const sut = createPlatformSettingsSUT();

    const result = await sut.whenChangedBy(
      'account-lea',
      NEW_TERMS,
      REASON,
      AT,
    );

    sut.thenRefusedWith(result, {
      name: 'NotABackOfficeAdminError',
      message: "Cette action est réservée à l'administration du site",
    });
    sut.thenNothingWasWritten();
  });

  it('refuses a change without a readable reason', async () => {
    const sut = createPlatformSettingsSUT();

    const result = await sut.whenChangedBy(
      sut.admin,
      NEW_TERMS,
      'trop bref',
      AT,
    );

    sut.thenRefusedWith(result, {
      name: 'MissingModerationReasonError',
      message:
        'Une action de modération exige un motif d’au moins 10 caractères',
    });
    sut.thenNothingWasWritten();
  });

  it('refuses an answer delay longer than a card hold lives', async () => {
    const sut = createPlatformSettingsSUT();

    const result = await sut.whenChangedBy(
      sut.admin,
      { ...NEW_TERMS, requestExpiryHours: 97 },
      REASON,
      AT,
    );

    sut.thenRefusedWith(result, {
      name: 'InvalidPlatformSettingsError',
      message:
        'Le délai de réponse du loueur doit être un nombre entier d’heures, entre 1 et 96',
    });
    sut.thenNothingWasWritten();
  });

  it('refuses a commission finer than a hundredth of a point', async () => {
    const sut = createPlatformSettingsSUT();

    const result = await sut.whenChangedBy(
      sut.admin,
      { ...NEW_TERMS, platformFeePercent: 12.345 },
      REASON,
      AT,
    );

    sut.thenRefusedWith(result, {
      name: 'InvalidPlatformSettingsError',
      message:
        'La commission doit être comprise entre 0 et 50 %, au centième près',
    });
  });

  it('writes nothing when every value is already the one in force', async () => {
    const sut = createPlatformSettingsSUT();

    const result = await sut.whenChangedBy(
      sut.admin,
      DEFAULT_PLATFORM_SETTINGS,
      REASON,
      AT,
    );

    sut.thenRefusedWith(result, {
      name: 'PlatformSettingsUnchangedError',
      message: 'Aucun réglage n’a changé : il n’y a rien à enregistrer',
    });
    sut.thenNothingWasWritten();
  });
});

describe('ReadPlatformSettings', () => {
  it('gives the administrator the settings in force and the bounds the api enforces', async () => {
    const sut = createPlatformSettingsSUT();

    const result = await sut.whenReadBy(sut.admin);

    expect(result).toEqual(
      Either.right({
        settings: DEFAULT_PLATFORM_SETTINGS,
        bounds: PLATFORM_SETTINGS_BOUNDS,
      }),
    );
  });

  it('refuses an account that does not administer the site', async () => {
    const sut = createPlatformSettingsSUT();

    const result = await sut.whenReadBy('account-lea');

    sut.thenRefusedWith(result, {
      name: 'NotABackOfficeAdminError',
      message: "Cette action est réservée à l'administration du site",
    });
  });
});
