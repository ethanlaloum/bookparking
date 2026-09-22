import type { Observable } from 'rxjs';

import type { AdminAccount } from '../entities/AdminAccount';
import type { AdminListing } from '../entities/AdminListing';
import type { AdminRentalRequest } from '../entities/AdminRentalRequest';
import type { Overview } from '../entities/Overview';

/**
 * Un refus de l'api n'est pas qu'un message : l'écran en fait trois choses
 * différentes. Une session périmée reconduit à la connexion, un 403 dit que ce
 * compte n'administre rien, et le reste s'affiche en bandeau au-dessus de la
 * liste concernée. Le message reste celui de l'api — c'est lui qui est écrit
 * pour un humain — mais `kind` est ce sur quoi les epics branchent.
 */
export type FailureKind =
  | 'session-expired'
  | 'forbidden'
  | 'not-found'
  | 'refused'
  | 'other';

export class BackOfficeError extends Error {
  public readonly kind: FailureKind;

  constructor(kind: FailureKind, message: string) {
    super(message);
    this.name = 'BackOfficeError';
    this.kind = kind;
  }
}

export interface Failure {
  errorCode: string;
  kind: FailureKind;
}

export const failureOf = (error: Error): Failure =>
  error instanceof BackOfficeError
    ? { errorCode: error.message, kind: error.kind }
    : { errorCode: error.message, kind: 'other' };

export interface BackOfficeGateway {
  /**
   * Ne rend rien : c'est l'absence de refus qui est la réponse. Le site public
   * s'en sert pour savoir s'il doit offrir ses onglets d'administration, sans
   * tirer les dix-sept compteurs du tableau de bord pour n'en garder qu'un
   * booléen.
   */
  confirmAccess(): Observable<void>;
  readOverview(): Observable<Overview>;
  listAccounts(): Observable<AdminAccount[]>;
  listListings(): Observable<AdminListing[]>;
  listRentalRequests(): Observable<AdminRentalRequest[]>;
  unpublishListing(listingId: string, reason: string): Observable<void>;
  suspendAccount(accountId: string, reason: string): Observable<void>;
  liftAccountSuspension(accountId: string, reason: string): Observable<void>;
  cancelRentalRequest(requestId: string, reason: string): Observable<void>;
}
