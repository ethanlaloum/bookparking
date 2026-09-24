import { NEVER, Observable, of, throwError } from 'rxjs';

import type {
  AccountGateway,
  ChangePasswordPayload,
  RegisterAccountPayload,
} from '../../app/account/domain/ports/AccountGateway';
import type { Account, OwnAccount } from '../../app/account/domain/entities/Account';
import type { Avatar } from '../../app/account/domain/entities/Avatar';
import type { HumanChallenge } from '../../app/account/domain/entities/HumanProof';
import type { Session } from '../../app/auth/domain/entities/Session';
import type { Credentials, SessionGateway } from '../../app/auth/domain/ports/SessionGateway';
import type { AdminAccount } from '../../app/back-office/domain/entities/AdminAccount';
import type { AdminListing } from '../../app/back-office/domain/entities/AdminListing';
import type { AdminRentalRequest } from '../../app/back-office/domain/entities/AdminRentalRequest';
import type { Overview } from '../../app/back-office/domain/entities/Overview';
import {
  BackOfficeError,
  type BackOfficeGateway,
  type FailureKind,
} from '../../app/back-office/domain/ports/BackOfficeGateway';
import type { SessionStore } from '../../app/auth/domain/ports/SessionStore';
import type { Consent } from '../../app/consent/domain/entities/Consent';
import type { Clock } from '../../app/consent/domain/ports/Clock';
import type { ConsentStore } from '../../app/consent/domain/ports/ConsentStore';
import type {
  AddressSuggestion,
  LocatedAddress,
} from '../../app/listing/domain/entities/Coordinates';
import type { Listing } from '../../app/listing/domain/entities/Listing';
import type { GeocodingGateway } from '../../app/listing/domain/ports/GeocodingGateway';
import type {
  ListingGateway,
  OwnerListing,
  PublishListingPayload,
  UpdatePricingPayload,
} from '../../app/listing/domain/ports/ListingGateway';
import type { RentalRequestView } from '../../app/rental/domain/entities/RentalRequestView';
import type { PaymentPageNavigator } from '../../app/rental/domain/ports/PaymentPageNavigator';
import type {
  CancellationOutcome,
  RentalGateway,
  RequestedRental,
  RequestRentalPayload,
} from '../../app/rental/domain/ports/RentalGateway';
import type { Dependencies } from '../dependencies.interface';

const fail = <T>(message: string): Observable<T> => throwError(() => new Error(message));

export class InMemorySessionGateway implements SessionGateway {
  public session: Session = { token: 'jeton-de-test', validUntil: '2099-01-01T00:00:00.000Z' };
  public rejection: string | null = null;
  public readonly received: Credentials[] = [];

  signIn(credentials: Credentials): Observable<Session> {
    this.received.push(credentials);
    return this.rejection === null ? of(this.session) : fail(this.rejection);
  }
}

export class InMemorySessionStore implements SessionStore {
  public saved: Session | null = null;
  public cleared = false;

  read(): Session | null {
    return this.saved;
  }

  save(session: Session): void {
    this.saved = session;
  }

  clear(): void {
    this.saved = null;
    this.cleared = true;
  }
}

export class InMemoryConsentStore implements ConsentStore {
  public saved: Consent | null = null;

  read(): Consent | null {
    return this.saved;
  }

  save(consent: Consent): void {
    this.saved = consent;
  }
}

export class FixedClock implements Clock {
  public current = new Date('2026-09-23T08:00:00.000Z');

  now(): Date {
    return new Date(this.current);
  }
}

export class InMemoryListingGateway implements ListingGateway {
  public listings: Listing[] = [];
  public rejection: string | null = null;
  public readonly published: PublishListingPayload[] = [];
  public readonly unpublished: string[] = [];
  public readonly repriced: { id: string; pricing: UpdatePricingPayload }[] = [];
  public listCallCount = 0;
  public ownerListings: OwnerListing[] = [];
  public listMineCallCount = 0;

  listActive(): Observable<Listing[]> {
    this.listCallCount += 1;
    return this.rejection === null ? of(this.listings) : fail(this.rejection);
  }

  listMine(): Observable<OwnerListing[]> {
    this.listMineCallCount += 1;
    return this.rejection === null ? of(this.ownerListings) : fail(this.rejection);
  }

  getById(id: string): Observable<Listing> {
    const found = this.listings.find((listing) => listing.id === id);
    if (found === undefined) return fail('Annonce introuvable');
    return of(found);
  }

  publish(payload: PublishListingPayload): Observable<void> {
    this.published.push(payload);
    return this.rejection === null ? of(undefined) : fail(this.rejection);
  }

  unpublish(id: string): Observable<void> {
    this.unpublished.push(id);
    return this.rejection === null ? of(undefined) : fail(this.rejection);
  }

  updatePricing(id: string, pricing: UpdatePricingPayload): Observable<Listing> {
    this.repriced.push({ id, pricing });
    if (this.rejection !== null) return fail(this.rejection);
    const found = this.listings.find((listing) => listing.id === id);
    if (found === undefined) return fail("Cette place n'a aucune annonce active");
    return of({
      ...found,
      pricing: {
        dayInCents: pricing.dayInCents ?? null,
        weekInCents: pricing.weekInCents ?? null,
        monthInCents: pricing.monthInCents ?? null,
      },
    });
  }
}

export class InMemoryRentalGateway implements RentalGateway {
  public rejection: string | null = null;
  public readonly requested: RequestRentalPayload[] = [];
  public readonly intents: string[] = [];
  public readonly confirmed: string[] = [];
  public readonly abandoned: string[] = [];
  public readonly cancelled: string[] = [];
  public cancellationOutcome: CancellationOutcome = 'REFUNDED';
  public requestedRental: RequestedRental = {
    id: '45fed099-ae81-4a57-b24e-7005a96cd4a0',
    checkoutUrl: 'https://checkout.stripe.com/c/pay/cs_test_lea',
  };
  public myRequests: RentalRequestView[] = [];
  public receivedRequests: RentalRequestView[] = [];
  public listReceivedCallCount = 0;

  request(payload: RequestRentalPayload, idempotencyKey: string): Observable<RequestedRental> {
    this.requested.push(payload);
    this.intents.push(idempotencyKey);
    return this.rejection === null ? of(this.requestedRental) : fail(this.rejection);
  }

  cancel(requestId: string): Observable<CancellationOutcome> {
    this.cancelled.push(requestId);
    return this.rejection === null ? of(this.cancellationOutcome) : fail(this.rejection);
  }

  abandon(requestId: string): Observable<void> {
    this.abandoned.push(requestId);
    return this.rejection === null ? of(undefined) : fail(this.rejection);
  }

  listMine(): Observable<RentalRequestView[]> {
    return this.rejection === null ? of(this.myRequests) : fail(this.rejection);
  }

  listReceived(): Observable<RentalRequestView[]> {
    this.listReceivedCallCount += 1;
    return this.rejection === null ? of(this.receivedRequests) : fail(this.rejection);
  }

  confirm(requestId: string): Observable<void> {
    this.confirmed.push(requestId);
    return this.rejection === null ? of(undefined) : fail(this.rejection);
  }
}

export class InMemoryPaymentPageNavigator implements PaymentPageNavigator {
  public readonly opened: string[] = [];

  open(url: string): void {
    this.opened.push(url);
  }
}

export class InMemoryAccountGateway implements AccountGateway {
  public account: Account = { id: 'compte-1', email: 'alice@example.com' };
  public rejection: string | null = null;
  public readonly registered: RegisterAccountPayload[] = [];
  public readonly passwordChanges: ChangePasswordPayload[] = [];
  public challenge: HumanChallenge | null = null;
  public challengesServed = 0;
  public ownAccount: OwnAccount = {
    id: '7c2e5b1a-4d3f-4a8e-9b6c-2e1f0a9d8c7b',
    email: 'lea.t@example.com',
    avatar: 'SIGNAL',
  };
  public ownAccountRejection: string | null = null;
  public readonly avatarsChosen: Avatar[] = [];
  public avatarRejection: string | null = null;
  // Une api qui ne répond pas encore : ce que l'écran montre pendant l'attente.
  public avatarResponseHeld = false;

  getHumanChallenge(): Observable<HumanChallenge> {
    this.challengesServed += 1;
    return this.challenge === null ? fail('Défi indisponible') : of(this.challenge);
  }

  register(payload: RegisterAccountPayload): Observable<Account> {
    this.registered.push(payload);
    return this.rejection === null ? of(this.account) : fail(this.rejection);
  }

  changePassword(payload: ChangePasswordPayload): Observable<void> {
    this.passwordChanges.push(payload);
    return this.rejection === null ? of(undefined) : fail(this.rejection);
  }

  readOwnAccount(): Observable<OwnAccount> {
    return this.ownAccountRejection === null ? of(this.ownAccount) : fail(this.ownAccountRejection);
  }

  chooseAvatar(avatar: Avatar): Observable<void> {
    this.avatarsChosen.push(avatar);
    if (this.avatarResponseHeld) return NEVER;
    return this.avatarRejection === null ? of(undefined) : fail(this.avatarRejection);
  }
}

export class InMemoryGeocodingGateway implements GeocodingGateway {
  public readonly locatedByAddress = new Map<string, LocatedAddress>();
  public readonly asked: string[] = [];

  public readonly suggestionsByQuery = new Map<string, AddressSuggestion[]>();
  public readonly queried: string[] = [];

  locate(address: string): Observable<LocatedAddress | null> {
    this.asked.push(address);
    return of(this.locatedByAddress.get(address) ?? null);
  }

  suggest(query: string): Observable<AddressSuggestion[]> {
    this.queried.push(query);
    return of(this.suggestionsByQuery.get(query) ?? []);
  }
}

export interface InMemoryDependencies extends Dependencies {
  accountGateway: InMemoryAccountGateway;
  backOfficeGateway: InMemoryBackOfficeGateway;
  clock: FixedClock;
  consentStore: InMemoryConsentStore;
  geocodingGateway: InMemoryGeocodingGateway;
  listingGateway: InMemoryListingGateway;
  paymentPageNavigator: InMemoryPaymentPageNavigator;
  rentalGateway: InMemoryRentalGateway;
  sessionGateway: InMemorySessionGateway;
  sessionStore: InMemorySessionStore;
}

export const buildInMemoryDependencies = (): InMemoryDependencies => ({
  accountGateway: new InMemoryAccountGateway(),
  backOfficeGateway: new InMemoryBackOfficeGateway(),
  clock: new FixedClock(),
  consentStore: new InMemoryConsentStore(),
  geocodingGateway: new InMemoryGeocodingGateway(),
  listingGateway: new InMemoryListingGateway(),
  paymentPageNavigator: new InMemoryPaymentPageNavigator(),
  rentalGateway: new InMemoryRentalGateway(),
  sessionGateway: new InMemorySessionGateway(),
  sessionStore: new InMemorySessionStore(),
});

export const aListing = (overrides: Partial<Listing> = {}): Listing => ({
  id: '3f1a9c0e-9c1e-4c5e-8a2b-1f2d3e4a5b6c',
  address: '12 rue Barla, 06300 Nice',
  box: 'B12',
  photos: ['photo-1.jpg'],
  pricing: { dayInCents: 1500, weekInCents: 8000, monthInCents: 25000 },
  availability: { from: '2026-10-01T00:00:00.000Z', to: '2026-12-31T00:00:00.000Z' },
  ...overrides,
  // Réaffirmé après l'étalement : `Partial` rend le champ `undefined`-able, et
  // une surcharge qui ne le mentionne pas l'effacerait.
  acceptedVehicles: overrides.acceptedVehicles ?? ['voiture'],
});

export const aRentalRequestView = (
  overrides: Partial<RentalRequestView> = {},
): RentalRequestView => ({
  id: '45fed099-ae81-4a57-b24e-7005a96cd4a0',
  listingId: '3f1a9c0e-9c1e-4c5e-8a2b-1f2d3e4a5b6c',
  address: '12 rue Barla, 06300 Nice',
  box: 'B12',
  fromDay: '2026-10-10',
  toDay: '2026-10-12',
  priceInCents: 4500,
  status: 'PENDING',
  requestedAt: '2026-09-20T09:00:00.000Z',
  confirmedAt: null,
  ...overrides,
  money: overrides.money ?? 'NONE',
  startsAt: overrides.startsAt ?? '2026-10-09T22:00:00.000Z',
  freeCancellationUntil: overrides.freeCancellationUntil ?? '2026-10-08T22:00:00.000Z',
});

export const anOwnerListing = (overrides: Partial<OwnerListing> = {}): OwnerListing => ({
  id: '3f1a9c0e-9c1e-4c5e-8a2b-1f2d3e4a5b6c',
  address: '12 rue Barla, 06300 Nice',
  box: 'B12',
  status: 'ACTIVE',
  photos: ['photo-1.jpg'],
  pricing: { dayInCents: 1500, weekInCents: 8000, monthInCents: 25000 },
  availability: { from: '2026-10-01T00:00:00.000Z', to: '2026-12-31T00:00:00.000Z' },
  ...overrides,
  acceptedVehicles: overrides.acceptedVehicles ?? ['voiture'],
});


/* -------------------------------------------------------------------------- */
/* Administration du site                                                      */
/* -------------------------------------------------------------------------- */

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
