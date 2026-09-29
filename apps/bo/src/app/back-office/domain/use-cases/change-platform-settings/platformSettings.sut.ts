import {
  selectAdminAccess,
  selectChangeSettingsError,
  selectChangeSettingsSuccess,
  selectJournal,
  selectPlatformSettingsForm,
} from '../../../../../selectors/backOfficeSelectors';
import {
  aJournalEntry,
  aPlatformSettingsForm,
  buildInMemoryDependencies,
  type InMemoryDependencies,
} from '../../../../../store/testing/InMemoryDependencies';
import { createTestStore } from '../../../../../store/testing/createTestStore';
import type { AdminJournalEntry, JournalFilter } from '../../entities/AdminJournalEntry';
import type { PlatformSettings, PlatformSettingsForm } from '../../entities/PlatformSettings';
import type { FailureKind } from '../../ports/BackOfficeGateway';
import { readAdminJournalRequested } from '../read-admin-journal/readAdminJournalEpic';
import { readPlatformSettingsRequested } from '../read-platform-settings/readPlatformSettingsEpic';
import { changePlatformSettingsRequested } from './changePlatformSettingsEpic';

export const createPlatformSettingsSut = () => {
  const dependencies: InMemoryDependencies = buildInMemoryDependencies();
  const store = createTestStore(dependencies);
  const gateway = dependencies.backOfficeGateway;

  return {
    aJournalEntry,
    aPlatformSettingsForm,

    givenTheApiHolds(form: PlatformSettingsForm): void {
      gateway.settingsForm = form;
    },
    givenTheJournalHolds(entries: AdminJournalEntry[]): void {
      gateway.journal = entries;
    },
    givenTheApiRejectsWith(kind: FailureKind, message: string): void {
      gateway.rejectWith(kind, message);
    },
    whenReadingTheSettings(): void {
      store.dispatch(readPlatformSettingsRequested());
    },
    whenReadingTheJournal(): void {
      store.dispatch(readAdminJournalRequested());
    },
    whenChanging(settings: PlatformSettings, reason: string): void {
      store.dispatch(changePlatformSettingsRequested({ settings, reason }));
    },
    thenTheFormShownIs(expected: PlatformSettingsForm | null): void {
      const actual = selectPlatformSettingsForm(store.getState());
      if (JSON.stringify(actual) !== JSON.stringify(expected))
        throw new Error(`Formulaire attendu ${JSON.stringify(expected)}, obtenu ${JSON.stringify(actual)}`);
    },
    thenTheApiWasAskedTo(expected: { settings: PlatformSettings; reason: string }[]): void {
      if (JSON.stringify(gateway.settingsChanges) !== JSON.stringify(expected))
        throw new Error(`Changements transmis inattendus : ${JSON.stringify(gateway.settingsChanges)}`);
    },
    thenItSucceeded(expected: boolean): void {
      const actual = selectChangeSettingsSuccess(store.getState());
      if (actual !== expected) throw new Error(`Succès attendu ${expected}, obtenu ${actual}`);
    },
    thenTheErrorShownIs(expected: string | null): void {
      const actual = selectChangeSettingsError(store.getState());
      if (actual !== expected)
        throw new Error(`Erreur attendue "${String(expected)}", obtenue "${String(actual)}"`);
    },
    thenTheRereadsAre(expected: { settings: number; journal: number }): void {
      const actual = { settings: gateway.readSettingsCallCount, journal: gateway.readJournalCallCount };
      if (JSON.stringify(actual) !== JSON.stringify(expected))
        throw new Error(`Relectures attendues ${JSON.stringify(expected)}, obtenues ${JSON.stringify(actual)}`);
    },
    thenTheJournalShownIs(filter: JournalFilter, expectedIds: string[]): void {
      const actual = selectJournal(store.getState(), filter).map((entry) => entry.id);
      if (JSON.stringify(actual) !== JSON.stringify(expectedIds))
        throw new Error(`Journal attendu ${expectedIds.join(',')}, obtenu ${actual.join(',')}`);
    },
    thenTheAccessIs(expected: 'unknown' | 'granted' | 'denied'): void {
      const actual = selectAdminAccess(store.getState());
      if (actual !== expected) throw new Error(`Accès attendu ${expected}, obtenu ${actual}`);
    },
  };
};
