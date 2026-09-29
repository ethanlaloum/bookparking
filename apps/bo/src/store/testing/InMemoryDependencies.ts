import { Observable, of, throwError } from 'rxjs';

import {
  InMemorySessionGateway,
  InMemorySessionStore,
} from '@front/store/testing/InMemoryDependencies';

import type { AdminAccount } from '../../app/back-office/domain/entities/AdminAccount';
import type { AdminJournalEntry } from '../../app/back-office/domain/entities/AdminJournalEntry';
import type {
  AdminRentalIssue,
  IssueResolution,
} from '../../app/back-office/domain/entities/AdminRentalIssue';
import type { AdminListing } from '../../app/back-office/domain/entities/AdminListing';
import type { AdminRentalRequest } from '../../app/back-office/domain/entities/AdminRentalRequest';
import type { Overview } from '../../app/back-office/domain/entities/Overview';
import type {
  PlatformSettings,
  PlatformSettingsForm,
} from '../../app/back-office/domain/entities/PlatformSettings';
import {
  BackOfficeError,
  type BackOfficeGateway,
  type FailureKind,
} from '../../app/back-office/domain/ports/BackOfficeGateway';
import type { Dependencies } from '../dependencies.interface';

export interface InMemoryDependencies extends Dependencies {
  backOfficeGateway: InMemoryBackOfficeGateway;
  sessionGateway: InMemorySessionGateway;
  sessionStore: InMemorySessionStore;
}

export const buildInMemoryDependencies = (): InMemoryDependencies => ({
  backOfficeGateway: new InMemoryBackOfficeGateway(),
  sessionGateway: new InMemorySessionGateway(),
  sessionStore: new InMemorySessionStore(),
});


const DEFAULT_COUNTS: Overview['counts'] = {
  accounts: 12,
  suspendedAccounts: 1,
  activeListings: 8,
  unpublishedListings: 2,
  pendingRequests: 3,
  confirmedRequests: 5,
  cancelledRequests: 1,
  confirmedRevenueInCents: 45_000,
};

const DEFAULT_ACTIVITY: Overview['activity'] = {
  accountsLast24h: 1,
  listingsLast24h: 2,
  requestsLast24h: 3,
  accountsLast7d: 4,
  listingsLast7d: 5,
  requestsLast7d: 6,
};

const DEFAULT_ATTENTION: Overview['attention'] = {
  requestsPendingOverADay: 0,
  listingsWithoutAnyPrice: 0,
  accountsWithoutAnyActivity: 0,
  openRentalIssues: 0,
};

// Surcharge bloc par bloc, et non `Partial<Overview>` : un test qui ne
// s'intéresse qu'aux revenus n'a pas à recopier les sept autres compteurs pour
// que le type passe.
export interface OverviewOverrides {
  counts?: Partial<Overview['counts']>;
  activity?: Partial<Overview['activity']>;
  attention?: Partial<Overview['attention']>;
}

export const anOverview = (overrides: OverviewOverrides = {}): Overview => ({
  counts: { ...DEFAULT_COUNTS, ...overrides.counts },
  activity: { ...DEFAULT_ACTIVITY, ...overrides.activity },
  attention: { ...DEFAULT_ATTENTION, ...overrides.attention },
});

export const anAdminAccount = (overrides: Partial<AdminAccount> = {}): AdminAccount => ({
  id: '0b3d1f8a-0000-4000-8000-000000000001',
  email: 'alice@example.com',
  registeredAt: '2026-09-01T09:00:00.000Z',
  suspendedAt: null,
  listingCount: 1,
  requestCount: 0,
  ...overrides,
});

export const anAdminListing = (overrides: Partial<AdminListing> = {}): AdminListing => ({
  id: '3f1a9c0e-9c1e-4c5e-8a2b-1f2d3e4a5b6c',
  address: '12 rue Barla, 06300 Nice',
  box: 'B12',
  ownerEmail: 'alice@example.com',
  status: 'ACTIVE',
  publishedAt: '2026-09-05T10:00:00.000Z',
  ...overrides,
  // Réaffirmés après l'étalement, comme `aListing` : `Partial` rend chaque
  // champ `undefined`-able, et une surcharge qui ne les mentionne pas les
  // effacerait.
  acceptedVehicles: overrides.acceptedVehicles ?? ['voiture'],
  pricing: overrides.pricing ?? {
    dayInCents: 1500,
    weekInCents: 8000,
    monthInCents: 25_000,
  },
});

export const anAdminRentalRequest = (
  overrides: Partial<AdminRentalRequest> = {},
): AdminRentalRequest => ({
  id: '45fed099-ae81-4a57-b24e-7005a96cd4a0',
  address: '12 rue Barla, 06300 Nice',
  box: 'B12',
  ownerEmail: 'alice@example.com',
  renterEmail: 'bob@example.com',
  fromDay: '2026-10-10',
  toDay: '2026-10-12',
  priceInCents: 4500,
  status: 'PENDING',
  requestedAt: '2026-09-20T09:00:00.000Z',
  confirmedAt: null,
  ...overrides,
});

export const aPlatformSettingsForm = (
  settings: Partial<PlatformSettings> = {},
): PlatformSettingsForm => ({
  settings: {
    platformFeePercent: 15,
    freeCancellationHours: 24,
    requestExpiryHours: 48,
    payoutReleaseDelayHours: 24,
    ...settings,
  },
  bounds: {
    platformFeePercent: { min: 0, max: 50, decimals: 2 },
    freeCancellationHours: { min: 0, max: 336, decimals: 0 },
    requestExpiryHours: { min: 1, max: 96, decimals: 0 },
    payoutReleaseDelayHours: { min: 0, max: 720, decimals: 0 },
  },
});

export const aJournalEntry = (overrides: Partial<AdminJournalEntry> = {}): AdminJournalEntry => ({
  id: 'log-1',
  actedAt: '2026-10-02T10:00:00.000Z',
  adminEmail: 'admin@bookparking.fr',
  kind: 'SUSPEND_ACCOUNT',
  targetType: 'ACCOUNT',
  targetId: '0b3d1f8a-0000-4000-8000-000000000001',
  targetLabel: 'alice@example.com',
  reason: 'Paiements contestés par la banque',
  settingsChange: null,
  ...overrides,
});

export const anAdminRentalIssue = (overrides: Partial<AdminRentalIssue> = {}): AdminRentalIssue => ({
  id: '6f1c2d3e-4a5b-4c6d-8e7f-9a0b1c2d3e4f',
  requestId: '45fed099-ae81-4a57-b24e-7005a96cd4a0',
  reason: 'PLACE_OCCUPIED',
  message: 'Une Clio grise est garée sur la place',
  reportedAt: '2026-10-10T08:00:00.000Z',
  status: 'OPEN',
  ownerReply: null,
  ownerRepliedAt: null,
  refundInCents: null,
  resolvedAt: null,
  resolutionReason: null,
  address: '12 rue Barla, 06300 Nice',
  box: 'B12',
  fromDay: '2026-10-10',
  toDay: '2026-10-12',
  priceInCents: 4500,
  ownerShareInCents: 3825,
  renterEmail: 'lea@example.com',
  ownerEmail: 'marc@example.com',
  ...overrides,
});

export interface RecordedModeration {
  action: 'unpublishListing' | 'suspendAccount' | 'liftAccountSuspension' | 'cancelRentalRequest';
  targetId: string;
  reason: string;
}

export class InMemoryBackOfficeGateway implements BackOfficeGateway {
  public overview: Overview = anOverview();
  public accounts: AdminAccount[] = [];
  public listings: AdminListing[] = [];
  public rentalRequests: AdminRentalRequest[] = [];

  public rejection: BackOfficeError | null = null;

  public confirmAccessCallCount = 0;
  public readOverviewCallCount = 0;
  public listAccountsCallCount = 0;
  public listListingsCallCount = 0;
  public listRentalRequestsCallCount = 0;
  public readonly moderated: RecordedModeration[] = [];
  public settingsForm: PlatformSettingsForm = aPlatformSettingsForm();
  public journal: AdminJournalEntry[] = [];
  public readSettingsCallCount = 0;
  public readJournalCallCount = 0;
  public readonly settingsChanges: { settings: PlatformSettings; reason: string }[] = [];
  public issues: AdminRentalIssue[] = [];
  public listIssuesCallCount = 0;
  public readonly resolutions: { issueId: string; resolution: IssueResolution }[] = [];

  rejectWith(kind: FailureKind, message: string): void {
    this.rejection = new BackOfficeError(kind, message);
  }

  confirmAccess(): Observable<void> {
    this.confirmAccessCallCount += 1;
    return this.answer(undefined);
  }

  readOverview(): Observable<Overview> {
    this.readOverviewCallCount += 1;
    return this.answer(this.overview);
  }

  listAccounts(): Observable<AdminAccount[]> {
    this.listAccountsCallCount += 1;
    return this.answer(this.accounts);
  }

  listListings(): Observable<AdminListing[]> {
    this.listListingsCallCount += 1;
    return this.answer(this.listings);
  }

  listRentalRequests(): Observable<AdminRentalRequest[]> {
    this.listRentalRequestsCallCount += 1;
    return this.answer(this.rentalRequests);
  }

  unpublishListing(listingId: string, reason: string): Observable<void> {
    return this.record('unpublishListing', listingId, reason);
  }

  suspendAccount(accountId: string, reason: string): Observable<void> {
    return this.record('suspendAccount', accountId, reason);
  }

  liftAccountSuspension(accountId: string, reason: string): Observable<void> {
    return this.record('liftAccountSuspension', accountId, reason);
  }

  cancelRentalRequest(requestId: string, reason: string): Observable<void> {
    return this.record('cancelRentalRequest', requestId, reason);
  }

  readSettings(): Observable<PlatformSettingsForm> {
    this.readSettingsCallCount += 1;
    return this.answer(this.settingsForm);
  }

  changeSettings(settings: PlatformSettings, reason: string): Observable<void> {
    this.settingsChanges.push({ settings, reason });
    return this.answer(undefined);
  }

  readJournal(): Observable<AdminJournalEntry[]> {
    this.readJournalCallCount += 1;
    return this.answer(this.journal);
  }

  listIssues(): Observable<AdminRentalIssue[]> {
    this.listIssuesCallCount += 1;
    return this.answer(this.issues);
  }

  resolveIssue(issueId: string, resolution: IssueResolution): Observable<void> {
    this.resolutions.push({ issueId, resolution });
    return this.answer(undefined);
  }

  private record(
    action: RecordedModeration['action'],
    targetId: string,
    reason: string,
  ): Observable<void> {
    this.moderated.push({ action, targetId, reason });
    return this.answer(undefined);
  }

  private answer<T>(value: T): Observable<T> {
    const rejection = this.rejection;
    return rejection === null ? of(value) : throwError(() => rejection);
  }
}
