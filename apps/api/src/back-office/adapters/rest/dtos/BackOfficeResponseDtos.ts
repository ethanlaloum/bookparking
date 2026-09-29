export interface OverviewResponseDto {
  counts: {
    accounts: number;
    suspendedAccounts: number;
    activeListings: number;
    unpublishedListings: number;
    pendingRequests: number;
    confirmedRequests: number;
    cancelledRequests: number;
    confirmedRevenueInCents: number;
  };
  activity: {
    accountsLast24h: number;
    listingsLast24h: number;
    requestsLast24h: number;
    accountsLast7d: number;
    listingsLast7d: number;
    requestsLast7d: number;
  };
  attention: {
    requestsPendingOverADay: number;
    listingsWithoutAnyPrice: number;
    accountsWithoutAnyActivity: number;
  };
}

export interface AdminAccountResponseDto {
  id: string;
  email: string;
  registeredAt: string;
  suspendedAt: string | null;
  listingCount: number;
  requestCount: number;
}

export interface AdminListingResponseDto {
  id: string;
  address: string;
  box: string;
  ownerEmail: string;
  status: string;
  acceptedVehicles: string[];
  pricing: {
    dayInCents: number | null;
    weekInCents: number | null;
    monthInCents: number | null;
  };
  publishedAt: string;
}

export interface AdminRentalRequestResponseDto {
  id: string;
  address: string;
  box: string;
  ownerEmail: string;
  renterEmail: string;
  fromDay: string;
  toDay: string;
  priceInCents: number;
  status: string;
  requestedAt: string;
  confirmedAt: string | null;
}
