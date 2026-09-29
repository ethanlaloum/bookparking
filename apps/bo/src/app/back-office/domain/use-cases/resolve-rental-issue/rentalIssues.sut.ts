import {
  selectAdminAccess,
  selectOpenRentalIssueCount,
  selectRentalIssues,
  selectResolveIssueError,
  selectResolvedIssueId,
} from '../../../../../selectors/backOfficeSelectors';
import {
  anAdminRentalIssue,
  buildInMemoryDependencies,
  type InMemoryDependencies,
} from '../../../../../store/testing/InMemoryDependencies';
import { createTestStore } from '../../../../../store/testing/createTestStore';
import type { AdminRentalIssue, IssueResolution } from '../../entities/AdminRentalIssue';
import type { FailureKind } from '../../ports/BackOfficeGateway';
import { listRentalIssuesRequested } from '../list-rental-issues/listRentalIssuesEpic';
import { resolveRentalIssueRequested } from './resolveRentalIssueEpic';

export const createRentalIssuesSut = () => {
  const dependencies: InMemoryDependencies = buildInMemoryDependencies();
  const store = createTestStore(dependencies);
  const gateway = dependencies.backOfficeGateway;

  return {
    anAdminRentalIssue,

    givenTheApiHolds(issues: AdminRentalIssue[]): void {
      gateway.issues = issues;
    },
    givenTheApiRejectsWith(kind: FailureKind, message: string): void {
      gateway.rejectWith(kind, message);
    },
    whenListing(): void {
      store.dispatch(listRentalIssuesRequested());
    },
    whenResolving(issueId: string, resolution: IssueResolution): void {
      store.dispatch(resolveRentalIssueRequested({ issueId, resolution }));
    },
    thenTheIssuesShownAre(expectedIds: string[], openCount: number): void {
      const actual = {
        ids: selectRentalIssues(store.getState()).map((issue) => issue.id),
        open: selectOpenRentalIssueCount(store.getState()),
      };
      const expected = { ids: expectedIds, open: openCount };
      if (JSON.stringify(actual) !== JSON.stringify(expected))
        throw new Error(`Réclamations attendues ${JSON.stringify(expected)}, obtenues ${JSON.stringify(actual)}`);
    },
    thenTheApiWasAskedTo(expected: { issueId: string; resolution: IssueResolution }[]): void {
      if (JSON.stringify(gateway.resolutions) !== JSON.stringify(expected))
        throw new Error(`Décisions transmises inattendues : ${JSON.stringify(gateway.resolutions)}`);
    },
    thenTheResolvedIssueIs(expected: string | null): void {
      const actual = selectResolvedIssueId(store.getState());
      if (actual !== expected) throw new Error(`Réclamation tranchée attendue ${String(expected)}, obtenue ${String(actual)}`);
    },
    thenTheErrorShownIs(expected: string | null): void {
      const actual = selectResolveIssueError(store.getState());
      if (actual !== expected)
        throw new Error(`Erreur attendue "${String(expected)}", obtenue "${String(actual)}"`);
    },
    thenTheRereadsAre(expected: { issues: number; overview: number; journal: number }): void {
      const actual = {
        issues: gateway.listIssuesCallCount,
        overview: gateway.readOverviewCallCount,
        journal: gateway.readJournalCallCount,
      };
      if (JSON.stringify(actual) !== JSON.stringify(expected))
        throw new Error(`Relectures attendues ${JSON.stringify(expected)}, obtenues ${JSON.stringify(actual)}`);
    },
    thenTheAccessIs(expected: 'unknown' | 'granted' | 'denied'): void {
      const actual = selectAdminAccess(store.getState());
      if (actual !== expected) throw new Error(`Accès attendu ${expected}, obtenu ${actual}`);
    },
  };
};
