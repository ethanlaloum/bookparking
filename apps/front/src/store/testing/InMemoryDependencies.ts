import { Observable, of, throwError } from 'rxjs';

import type {
  AccountGateway,
  ChangePasswordPayload,
  RegisterAccountPayload,
} from '../../app/account/domain/ports/AccountGateway';
import type { Account } from '../../app/account/domain/entities/Account';
import type { Session } from '../../app/auth/domain/entities/Session';
import type { Credentials, SessionGateway } from '../../app/auth/domain/ports/SessionGateway';
import type { SessionStore } from '../../app/auth/domain/ports/SessionStore';
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
import type { RentalGateway, RequestRentalPayload } from '../../app/rental/domain/ports/RentalGateway';
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
  public readonly confirmed: string[] = [];
  public myRequests: RentalRequestView[] = [];
  public receivedRequests: RentalRequestView[] = [];
  public listReceivedCallCount = 0;

  request(payload: RequestRentalPayload): Observable<void> {
    this.requested.push(payload);
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

export class InMemoryAccountGateway implements AccountGateway {
  public account: Account = { id: 'compte-1', email: 'alice@example.com' };
  public rejection: string | null = null;
  public readonly registered: RegisterAccountPayload[] = [];
  public readonly passwordChanges: ChangePasswordPayload[] = [];

  register(payload: RegisterAccountPayload): Observable<Account> {
    this.registered.push(payload);
    return this.rejection === null ? of(this.account) : fail(this.rejection);
  }

  changePassword(payload: ChangePasswordPayload): Observable<void> {
    this.passwordChanges.push(payload);
    return this.rejection === null ? of(undefined) : fail(this.rejection);
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
  geocodingGateway: InMemoryGeocodingGateway;
  listingGateway: InMemoryListingGateway;
  rentalGateway: InMemoryRentalGateway;
  sessionGateway: InMemorySessionGateway;
  sessionStore: InMemorySessionStore;
}

export const buildInMemoryDependencies = (): InMemoryDependencies => ({
  accountGateway: new InMemoryAccountGateway(),
  geocodingGateway: new InMemoryGeocodingGateway(),
  listingGateway: new InMemoryListingGateway(),
  rentalGateway: new InMemoryRentalGateway(),
  sessionGateway: new InMemorySessionGateway(),
  sessionStore: new InMemorySessionStore(),
});

export const aListing = (overrides: Partial<Listing> = {}): Listing => ({
  id: '3f1a9c0e-9c1e-4c5e-8a2b-1f2d3e4a5b6c',
  address: '12 rue des Lilas, 75011 Paris',
  box: 'B12',
  photos: ['photo-1.jpg'],
  pricing: { dayInCents: 1500, weekInCents: 8000, monthInCents: 25000 },
  availability: { from: '2026-10-01T00:00:00.000Z', to: '2026-12-31T00:00:00.000Z' },
  ...overrides,
});

export const aRentalRequestView = (
  overrides: Partial<RentalRequestView> = {},
): RentalRequestView => ({
  id: '45fed099-ae81-4a57-b24e-7005a96cd4a0',
  listingId: '3f1a9c0e-9c1e-4c5e-8a2b-1f2d3e4a5b6c',
  address: '12 rue des Lilas, 75011 Paris',
  box: 'B12',
  fromDay: '2026-10-10',
  toDay: '2026-10-12',
  priceInCents: 4500,
  status: 'PENDING',
  requestedAt: '2026-09-20T09:00:00.000Z',
  confirmedAt: null,
  ...overrides,
});

export const anOwnerListing = (overrides: Partial<OwnerListing> = {}): OwnerListing => ({
  id: '3f1a9c0e-9c1e-4c5e-8a2b-1f2d3e4a5b6c',
  address: '12 rue des Lilas, 75011 Paris',
  box: 'B12',
  status: 'ACTIVE',
  photos: ['photo-1.jpg'],
  pricing: { dayInCents: 1500, weekInCents: 8000, monthInCents: 25000 },
  availability: { from: '2026-10-01T00:00:00.000Z', to: '2026-12-31T00:00:00.000Z' },
  ...overrides,
});
