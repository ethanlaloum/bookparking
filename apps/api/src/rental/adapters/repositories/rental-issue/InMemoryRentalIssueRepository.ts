import { RentalIssueState } from '../../../domain/entities/RentalIssue';
import {
  IssueContext,
  IssueRefundDue,
  RentalIssueRepository,
} from '../../../domain/ports/RentalIssueRepository';

type Rental = Omit<IssueContext, 'issue' | 'hasIssue'> & {
  paymentId: string | null;
};

// Les réservations sont posées à la main par les tests : ce dépôt ne connaît
// que ce dont une réclamation a besoin.
export class InMemoryRentalIssueRepository implements RentalIssueRepository {
  public readonly rentals = new Map<string, Rental>();
  public readonly issues = new Map<string, RentalIssueState>();
  public readonly refunds = new Map<string, string>();

  givenRental(rental: Rental): void {
    this.rentals.set(rental.requestId, rental);
  }

  public async findContext(requestId: string): Promise<IssueContext | null> {
    const rental = this.rentals.get(requestId);
    if (rental === undefined) return null;
    const issue = this.issueOf(requestId);
    return { ...rental, issue, hasIssue: issue !== null };
  }

  public async create(issue: RentalIssueState): Promise<boolean> {
    if (this.issueOf(issue.requestId) !== null) return false;
    this.issues.set(issue.id, issue);
    return true;
  }

  public async recordOwnerReply(
    issueId: string,
    reply: string,
    at: Date,
  ): Promise<boolean> {
    const issue = this.issues.get(issueId);
    if (
      issue === undefined ||
      issue.status !== 'OPEN' ||
      issue.ownerReply !== null
    )
      return false;
    this.issues.set(issueId, {
      ...issue,
      ownerReply: reply,
      ownerRepliedAt: at,
    });
    return true;
  }

  public async findRefundsDue(): Promise<IssueRefundDue[]> {
    return [...this.issues.values()]
      .filter(
        (issue) =>
          issue.status === 'PARTIALLY_REFUNDED' && !this.refunds.has(issue.id),
      )
      .flatMap((issue) => {
        const paymentId = this.rentals.get(issue.requestId)?.paymentId ?? null;
        return paymentId === null || issue.refundInCents === null
          ? []
          : [
              {
                issueId: issue.id,
                requestId: issue.requestId,
                paymentId,
                amountInCents: issue.refundInCents,
              },
            ];
      });
  }

  public async markRefunded(issueId: string, refundId: string): Promise<void> {
    if (!this.refunds.has(issueId)) this.refunds.set(issueId, refundId);
  }

  private issueOf(requestId: string): RentalIssueState | null {
    return (
      [...this.issues.values()].find(
        (issue) => issue.requestId === requestId,
      ) ?? null
    );
  }
}
