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
    openRentalIssues: number;
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

export interface PlatformSettingsDto {
  platformFeePercent: number;
  freeCancellationHours: number;
  requestExpiryHours: number;
  payoutReleaseDelayHours: number;
}

export interface SettingBoundsDto {
  min: number;
  max: number;
  decimals: number;
}

export interface PlatformSettingsFormResponseDto {
  settings: PlatformSettingsDto;
  bounds: Record<keyof PlatformSettingsDto, SettingBoundsDto>;
}

export interface AdminJournalEntryResponseDto {
  id: string;
  actedAt: string;
  adminEmail: string | null;
  kind:
    | 'UNPUBLISH_LISTING'
    | 'SUSPEND_ACCOUNT'
    | 'LIFT_ACCOUNT_SUSPENSION'
    | 'CANCEL_RENTAL_REQUEST'
    | 'CHANGE_PLATFORM_SETTINGS'
    | 'RESOLVE_RENTAL_ISSUE';
  targetType: 'LISTING' | 'ACCOUNT' | 'RENTAL_REQUEST' | 'PLATFORM_SETTINGS';
  targetId: string;
  targetLabel: string | null;
  reason: string | null;
  settingsChange: {
    before: PlatformSettingsDto | null;
    after: PlatformSettingsDto;
  } | null;
}

export interface AdminRentalIssueResponseDto {
  id: string;
  requestId: string;
  reason: 'NO_ACCESS' | 'PLACE_OCCUPIED' | 'OTHER';
  message: string | null;
  reportedAt: string;
  status: 'OPEN' | 'REFUNDED' | 'PARTIALLY_REFUNDED' | 'DISMISSED';
  ownerReply: string | null;
  ownerRepliedAt: string | null;
  refundInCents: number | null;
  resolvedAt: string | null;
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
