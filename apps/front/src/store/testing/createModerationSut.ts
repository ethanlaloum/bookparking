import type { ActionCreatorWithPayload } from '@reduxjs/toolkit';

import type { FailureKind } from '../../app/back-office/domain/ports/BackOfficeGateway';
import type { ModerationCommand } from '../../app/back-office/domain/use-cases/unpublish-listing/unpublishListingEpic';
import { resetModerationState } from '../../app/back-office/store/resetModerationState';
import {
  selectAdminAccess,
  selectModerationError,
  selectModerationSuccess,
} from '../../selectors/back-office/backOfficeSelectors';
import {
  buildInMemoryDependencies,
  type InMemoryBackOfficeGateway,
  type InMemoryDependencies,
  type RecordedModeration,
} from './InMemoryDependencies';
import { createTestStore } from './createTestStore';

/**
 * Les quatre actions de modération ont la même forme — une cible, un motif, un
 * 204 sans corps, une relecture. Ce socle est partagé pour la même raison que
 * `BackOfficeController.moderate` côté api : les écrire quatre fois inviterait
 * une divergence entre elles. Chaque `*.sut.ts` reste co-localisé avec son cas
 * d'usage et n'exprime que ce qui lui est propre.
 */
export const createModerationSut = (
  requested: ActionCreatorWithPayload<ModerationCommand>,
  countRefetches: (gateway: InMemoryBackOfficeGateway) => number,
) => {
  const dependencies: InMemoryDependencies = buildInMemoryDependencies();
  const store = createTestStore(dependencies);

  return {
    givenTheApiRejectsWith(kind: FailureKind, message: string): void {
      dependencies.backOfficeGateway.rejectWith(kind, message);
    },
    whenModerating(targetId: string, reason: string): void {
      store.dispatch(requested({ targetId, reason }));
    },
    whenTheDialogCloses(): void {
      store.dispatch(resetModerationState());
    },
    thenTheApiWasAskedTo(expected: RecordedModeration): void {
      const actual = dependencies.backOfficeGateway.moderated.at(-1);
      if (
        actual?.action !== expected.action ||
        actual.targetId !== expected.targetId ||
        actual.reason !== expected.reason
      )
        throw new Error(`Action transmise inattendue : ${JSON.stringify(actual)}`);
    },
    thenNothingWasAsked(): void {
      const count = dependencies.backOfficeGateway.moderated.length;
      if (count !== 0) throw new Error(`Aucune action attendue, ${count} transmise(s)`);
    },
    thenTheActionsSentAre(count: number): void {
      const actual = dependencies.backOfficeGateway.moderated.length;
      if (actual !== count) throw new Error(`Actions attendues ${count}, obtenues ${actual}`);
    },
    thenItSucceeded(): void {
      if (!selectModerationSuccess(store.getState()))
        throw new Error("L'action de modération devait réussir");
    },
    thenTheListWasRefetched(times: number): void {
      const actual = countRefetches(dependencies.backOfficeGateway);
      if (actual !== times) throw new Error(`Relectures attendues ${times}, obtenues ${actual}`);
    },
    thenTheDashboardWasRefetched(times: number): void {
      const actual = dependencies.backOfficeGateway.readOverviewCallCount;
      if (actual !== times)
        throw new Error(`Relectures du tableau de bord attendues ${times}, obtenues ${actual}`);
    },
    thenTheErrorShownIs(expected: string): void {
      const actual = selectModerationError(store.getState());
      if (actual !== expected)
        throw new Error(`Erreur attendue "${expected}", obtenue "${String(actual)}"`);
    },
    thenNoErrorRemains(): void {
      const actual = selectModerationError(store.getState());
      if (actual !== null) throw new Error(`Erreur résiduelle : "${actual}"`);
    },
    thenTheAccessIs(expected: 'unknown' | 'granted' | 'denied'): void {
      const actual = selectAdminAccess(store.getState());
      if (actual !== expected) throw new Error(`Accès attendu ${expected}, obtenu ${actual}`);
    },
  };
};
