import { PlatformSettings } from '../../../shared/platform-settings/domain/entities/PlatformSettings';
import { GenericTransaction } from '../../../shared/unit-of-work/GenericTransaction';
import {
  AdminAction,
  AdminActionKind,
  AdminTargetType,
} from '../entities/AdminAction';

export interface OverviewCounts {
  accounts: number;
  suspendedAccounts: number;
  activeListings: number;
  unpublishedListings: number;
  pendingRequests: number;
  confirmedRequests: number;
  cancelledRequests: number;
  confirmedRevenueInCents: number;
}

export interface OverviewActivity {
  accountsLast24h: number;
  listingsLast24h: number;
  requestsLast24h: number;
  accountsLast7d: number;
  listingsLast7d: number;
  requestsLast7d: number;
}

export interface OverviewAttention {
  requestsPendingOverADay: number;
  listingsWithoutAnyPrice: number;
  accountsWithoutAnyActivity: number;
  openRentalIssues: number;
}

export interface AdminAccountView {
  id: string;
  email: string;
  registeredAt: Date;
  suspendedAt: Date | null;
  listingCount: number;
  requestCount: number;
}

export interface AdminListingView {
  id: string;
  address: string;
  box: string;
  ownerId: string;
  ownerEmail: string;
  status: string;
  acceptedVehicles: string[];
  dayInCents: number | null;
  weekInCents: number | null;
  monthInCents: number | null;
  publishedAt: Date;
}

export interface AdminRentalRequestView {
  id: string;
  address: string;
  box: string;
  ownerEmail: string;
  renterEmail: string;
  fromDay: string;
  toDay: string;
  priceInCents: number;
  status: string;
  requestedAt: Date;
  confirmedAt: Date | null;
}

// Une ligne du journal d'administration, lisible sans autre lecture : qui, quoi,
// sur quoi, pourquoi. `targetLabel` nomme la cible (l'adresse d'une annonce,
// l'e-mail d'un compte) ; `null` quand elle a disparu depuis. Un changement de
// réglages porte la version écrite et celle qu'elle a remplacée.
export interface AdminJournalEntry {
  id: string;
  actedAt: Date;
  adminEmail: string | null;
  kind: AdminActionKind;
  targetType: AdminTargetType;
  targetId: string;
  targetLabel: string | null;
  reason: string | null;
  settingsChange: {
    before: PlatformSettings | null;
    after: PlatformSettings;
  } | null;
}

export type RentalIssueDecision =
  'REFUNDED' | 'PARTIALLY_REFUNDED' | 'DISMISSED';

// Une réclamation telle que Bookparking la lit pour trancher : les deux
// versions, la réservation, et ce que le loueur touchera — le plafond d'un
// remboursement partiel. Les adresses e-mail sont `null` pour un compte
// supprimé depuis.
export interface AdminRentalIssueView {
  id: string;
  requestId: string;
  reason: string;
  message: string | null;
  reportedAt: Date;
  status: string;
  ownerReply: string | null;
  ownerRepliedAt: Date | null;
  refundInCents: number | null;
  resolvedAt: Date | null;
  resolutionReason: string | null;
  address: string;
  box: string;
  fromDay: string;
  toDay: string;
  priceInCents: number;
  ownerShareInCents: number;
  renterEmail: string | null;
  ownerEmail: string | null;
}

export interface IssueToResolve {
  issueId: string;
  requestId: string;
  status: string;
  priceInCents: number;
  ownerShareInCents: number;
  renterId: string;
  ownerId: string;
}

export interface IssueResolution {
  status: RentalIssueDecision;
  refundInCents: number | null;
  resolvedAt: Date;
  resolvedBy: string;
  reason: string;
}

export interface PlatformSettingsChange {
  adminAccountId: string;
  reason: string;
  at: Date;
}

export interface CancelledRentalParties {
  renterId: string;
  ownerId: string;
}

export interface BackOfficeRepository {
  isAdmin(accountId: string, trx?: GenericTransaction): Promise<boolean>;
  countsOverview(trx?: GenericTransaction): Promise<OverviewCounts>;
  activityOverview(
    now: Date,
    trx?: GenericTransaction,
  ): Promise<OverviewActivity>;
  attentionOverview(
    now: Date,
    trx?: GenericTransaction,
  ): Promise<OverviewAttention>;
  findAllAccounts(trx?: GenericTransaction): Promise<AdminAccountView[]>;
  findAllListings(trx?: GenericTransaction): Promise<AdminListingView[]>;
  findAllRentalRequests(
    trx?: GenericTransaction,
  ): Promise<AdminRentalRequestView[]>;
  // Rendent `false` quand la cible n'existe pas, pour que le cas d'usage
  // distingue « rien à faire » de « fait ».
  unpublishListing(
    listingId: string,
    trx?: GenericTransaction,
  ): Promise<boolean>;
  setAccountSuspension(
    accountId: string,
    suspendedAt: Date | null,
    trx?: GenericTransaction,
  ): Promise<boolean>;
  // Rend les deux parties de la demande annulée, pour qu'elles en soient
  // prévenues ; `null` quand il n'y avait rien à annuler.
  cancelRentalRequest(
    requestId: string,
    trx?: GenericTransaction,
  ): Promise<CancelledRentalParties | null>;
  recordAction(action: AdminAction, trx?: GenericTransaction): Promise<void>;
  findRecentActions(
    limit: number,
    trx?: GenericTransaction,
  ): Promise<AdminAction[]>;
  // Écrit une nouvelle version des réglages, qui devient celle en vigueur, et
  // rend son identifiant.
  savePlatformSettings(
    settings: PlatformSettings,
    change: PlatformSettingsChange,
    trx?: GenericTransaction,
  ): Promise<string>;
  findJournal(
    limit: number,
    trx?: GenericTransaction,
  ): Promise<AdminJournalEntry[]>;
  // Les réclamations ouvertes d'abord, puis les plus récentes.
  findRentalIssues(trx?: GenericTransaction): Promise<AdminRentalIssueView[]>;
  findIssueToResolve(
    issueId: string,
    trx?: GenericTransaction,
  ): Promise<IssueToResolve | null>;
  // Rend `false` quand la réclamation n'était plus ouverte au moment d'écrire.
  resolveRentalIssue(
    issueId: string,
    resolution: IssueResolution,
    trx?: GenericTransaction,
  ): Promise<boolean>;
}
