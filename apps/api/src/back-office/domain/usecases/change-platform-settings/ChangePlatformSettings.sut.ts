import { Either } from 'effect/index';

import { InMemoryPlatformSettingsReader } from '../../../../shared/platform-settings/adapters/repositories/InMemoryPlatformSettingsReader';
import { PlatformSettings } from '../../../../shared/platform-settings/domain/entities/PlatformSettings';
import { InMemoryUnitOfWork } from '../../../../shared/unit-of-work/InMemoryUnitOfWork';
import { AdminAction } from '../../entities/AdminAction';
import {
  BackOfficeRepository,
  PlatformSettingsChange,
} from '../../ports/BackOfficeRepository';
import { ReadPlatformSettings } from '../read-platform-settings/ReadPlatformSettings';
import { ChangePlatformSettings } from './ChangePlatformSettings';

const ADMIN = 'account-admin';
const VERSION = 'version-2';

interface SavedVersion {
  settings: PlatformSettings;
  change: PlatformSettingsChange;
}

// Le dépôt du back-office n'a pas de doublure en mémoire : ces deux cas
// d'usage n'en lisent que trois méthodes, que ce faux tient à la main. Une
// version écrite devient celle que le lecteur rend, comme en base.
class FakeBackOfficeRepository {
  public admins = new Set<string>([ADMIN]);
  public versions: SavedVersion[] = [];
  public actions: AdminAction[] = [];

  constructor(private readonly reader: InMemoryPlatformSettingsReader) {}

  public async isAdmin(accountId: string): Promise<boolean> {
    return this.admins.has(accountId);
  }

  public async savePlatformSettings(
    settings: PlatformSettings,
    change: PlatformSettingsChange,
  ): Promise<string> {
    this.versions.push({ settings, change });
    this.reader.settings = settings;
    return VERSION;
  }

  public async recordAction(action: AdminAction): Promise<void> {
    this.actions.push(action);
  }
}

export const createPlatformSettingsSUT = () => {
  const reader = new InMemoryPlatformSettingsReader();
  const repository = new FakeBackOfficeRepository(reader);
  const asPort = repository as unknown as BackOfficeRepository;
  const change = new ChangePlatformSettings(
    asPort,
    reader,
    new InMemoryUnitOfWork(),
  );
  const read = new ReadPlatformSettings(asPort, reader);

  return {
    admin: ADMIN,
    version: VERSION,

    whenChangedBy(
      adminAccountId: string,
      settings: PlatformSettings,
      reason: string,
      at: string,
    ) {
      return change.execute({
        adminAccountId,
        settings,
        reason,
        actedAt: new Date(at),
      });
    },

    whenReadBy(adminAccountId: string) {
      return read.execute({ adminAccountId });
    },

    thenRefusedWith(
      result: Either.Either<unknown, Error>,
      expected: { name: string; message: string },
    ) {
      if (Either.isRight(result)) throw new Error('expected a refusal');
      expect({
        name: result.left.constructor.name,
        message: result.left.message,
      }).toEqual(expected);
    },

    thenNothingWasWritten() {
      expect({
        versions: repository.versions,
        actions: repository.actions,
      }).toEqual({ versions: [], actions: [] });
    },

    thenVersionsWritten(expected: SavedVersion[]) {
      expect(repository.versions).toEqual(expected);
    },

    thenActionsRecorded(expected: AdminAction[]) {
      expect(repository.actions).toEqual(expected);
    },

    async thenSettingsInForceAre(expected: PlatformSettings) {
      expect(await reader.current()).toEqual(expected);
    },
  };
};
