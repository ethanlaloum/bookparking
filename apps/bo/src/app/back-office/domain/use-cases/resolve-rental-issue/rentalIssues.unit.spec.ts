import { describe, it } from 'vitest';

import { createRentalIssuesSut } from './rentalIssues.sut';

const ISSUE = '6f1c2d3e-4a5b-4c6d-8e7f-9a0b1c2d3e4f';
const PARTIAL = {
  decision: 'PARTIAL_REFUND' as const,
  refundInCents: 1500,
  reason: 'Place occupée une demi-journée',
};

describe('the rental issues', () => {
  it('lists them as the api orders them, and counts the open ones', () => {
    const sut = createRentalIssuesSut();
    sut.givenTheApiHolds([
      sut.anAdminRentalIssue({ id: 'open' }),
      sut.anAdminRentalIssue({ id: 'dismissed', status: 'DISMISSED' }),
    ]);

    sut.whenListing();

    sut.thenTheIssuesShownAre(['open', 'dismissed'], 1);
    sut.thenTheAccessIs('granted');
  });

  it('sends the decision, then rereads the issues, the overview and the journal once', () => {
    const sut = createRentalIssuesSut();

    sut.whenResolving(ISSUE, PARTIAL);

    sut.thenTheApiWasAskedTo([{ issueId: ISSUE, resolution: PARTIAL }]);
    sut.thenTheResolvedIssueIs(ISSUE);
    sut.thenTheRereadsAre({ issues: 1, overview: 1, journal: 1 });
  });

  it('shows the api refusal and rereads nothing', () => {
    const sut = createRentalIssuesSut();
    sut.givenTheApiRejectsWith('refused', 'Cette réclamation a déjà été tranchée');

    sut.whenResolving(ISSUE, PARTIAL);

    sut.thenTheErrorShownIs('Cette réclamation a déjà été tranchée');
    sut.thenTheResolvedIssueIs(null);
    sut.thenTheRereadsAre({ issues: 0, overview: 0, journal: 0 });
  });
});
