import { GenericTransaction } from '../../../shared/unit-of-work/GenericTransaction';
import { IssueFacts, RentalIssueState } from '../entities/RentalIssue';

// Ce qu'une réclamation a besoin de savoir de sa réservation : ses deux
// parties, les faits qui décident si l'on peut encore se plaindre, et la
// réclamation déjà faite, s'il y en a une.
export interface IssueContext extends IssueFacts {
  requestId: string;
  renterId: string;
  ownerId: string;
  issue: RentalIssueState | null;
}

// Un remboursement partiel décidé par Bookparking, pas encore passé chez
// Stripe : le balayage le reprend jusqu'à ce que Stripe réponde.
export interface IssueRefundDue {
  issueId: string;
  requestId: string;
  paymentId: string;
  amountInCents: number;
}

export interface RentalIssueRepository {
  findContext(
    requestId: string,
    trx?: GenericTransaction,
  ): Promise<IssueContext | null>;
  // Rend `false` quand la réservation avait déjà sa réclamation : deux envois
  // simultanés n'en écrivent qu'une.
  create(issue: RentalIssueState, trx?: GenericTransaction): Promise<boolean>;
  // Rend `false` quand la réclamation n'est plus ouverte, ou déjà répondue.
  recordOwnerReply(
    issueId: string,
    reply: string,
    at: Date,
    trx?: GenericTransaction,
  ): Promise<boolean>;
  findRefundsDue(trx?: GenericTransaction): Promise<IssueRefundDue[]>;
  markRefunded(
    issueId: string,
    refundId: string,
    trx?: GenericTransaction,
  ): Promise<void>;
}
