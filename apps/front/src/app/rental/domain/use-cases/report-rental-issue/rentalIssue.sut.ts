import {
  selectAnswerIssueStateFor,
  selectReportIssueError,
  selectReportedRentalRequestId,
} from '../../../../../selectors/rental/rentalSelectors';
import {
  buildInMemoryDependencies,
  type InMemoryDependencies,
} from '../../../../../store/testing/InMemoryDependencies';
import { createTestStore } from '../../../../../store/testing/createTestStore';
import type { IssueReport } from '../../ports/RentalGateway';
import { answerRentalIssueRequested } from '../answer-rental-issue/answerRentalIssueEpic';
import { reportRentalIssueRequested, resetReportRentalIssue } from './reportRentalIssueEpic';

export const createRentalIssueSut = () => {
  const dependencies: InMemoryDependencies = buildInMemoryDependencies();
  const store = createTestStore(dependencies);
  const gateway = dependencies.rentalGateway;

  return {
    givenTheApiRejectsWith(message: string): void {
      gateway.rejection = message;
    },
    whenReporting(requestId: string, report: IssueReport): void {
      store.dispatch(reportRentalIssueRequested({ requestId, report }));
    },
    whenTheDialogReopens(): void {
      store.dispatch(resetReportRentalIssue());
    },
    whenAnswering(requestId: string, reply: string): void {
      store.dispatch(answerRentalIssueRequested({ requestId, reply }));
    },
    thenTheApiReceived(expected: {
      reported?: { requestId: string; report: IssueReport }[];
      answered?: { requestId: string; reply: string }[];
    }): void {
      const actual = {
        reported: gateway.reportedIssues,
        answered: gateway.answeredIssues,
      };
      const wanted = { reported: expected.reported ?? [], answered: expected.answered ?? [] };
      if (JSON.stringify(actual) !== JSON.stringify(wanted))
        throw new Error(`Envois attendus ${JSON.stringify(wanted)}, obtenus ${JSON.stringify(actual)}`);
    },
    thenTheListsWereReread(expected: { mine: number; received: number }): void {
      const actual = { mine: gateway.listMineCallCount, received: gateway.listReceivedCallCount };
      if (JSON.stringify(actual) !== JSON.stringify(expected))
        throw new Error(`Relectures attendues ${JSON.stringify(expected)}, obtenues ${JSON.stringify(actual)}`);
    },
    thenTheReportedRequestIs(expected: string | null): void {
      const actual = selectReportedRentalRequestId(store.getState());
      if (actual !== expected) throw new Error(`Demande attendue ${String(expected)}, obtenue ${String(actual)}`);
    },
    thenTheReportErrorIs(expected: string | null): void {
      const actual = selectReportIssueError(store.getState());
      if (actual !== expected)
        throw new Error(`Erreur attendue "${String(expected)}", obtenue "${String(actual)}"`);
    },
    thenTheAnswerStateOf(requestId: string, expected: { pending: boolean; error: string | null }): void {
      const actual = selectAnswerIssueStateFor(store.getState(), requestId);
      if (JSON.stringify(actual) !== JSON.stringify(expected))
        throw new Error(`État attendu ${JSON.stringify(expected)}, obtenu ${JSON.stringify(actual)}`);
    },
  };
};
