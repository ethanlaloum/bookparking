import { GenericTransaction } from '../../../shared/unit-of-work/GenericTransaction';
import { AdminAction } from '../entities/AdminAction';

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
  cancelRentalRequest(
    requestId: string,
    trx?: GenericTransaction,
  ): Promise<boolean>;
  recordAction(action: AdminAction, trx?: GenericTransaction): Promise<void>;
  findRecentActions(
    limit: number,
    trx?: GenericTransaction,
  ): Promise<AdminAction[]>;
}
