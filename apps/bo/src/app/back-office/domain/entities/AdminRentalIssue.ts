import type { components } from '@front/api/schema';

export type AdminRentalIssue = components['schemas']['AdminRentalIssue'];
export type IssueDecision = components['schemas']['ResolveRentalIssueRequest']['decision'];

export interface IssueResolution {
  decision: IssueDecision;
  refundInCents: number | null;
  reason: string;
}

export const isOpen = (issue: AdminRentalIssue): boolean => issue.status === 'OPEN';

/**
 * Report de la borne de l'api (`ResolveRentalIssue.resolutionOf`) : un
 * remboursement partiel se prend sur la part du loueur et lui en laisse au
 * moins un centime. Au-delà, c'est un remboursement total.
 */
export const maximumPartialRefundInCents = (issue: AdminRentalIssue): number =>
  issue.ownerShareInCents - 1;

export const isAcceptablePartialRefund = (issue: AdminRentalIssue, cents: number): boolean =>
  Number.isInteger(cents) && cents >= 1 && cents <= maximumPartialRefundInCents(issue);
