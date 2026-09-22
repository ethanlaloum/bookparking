import { firstValueFrom } from 'rxjs';

import { InMemoryHttpClient } from '../../../lib/http/InMemoryHttpClient';
import { aListing } from '../../../store/testing/InMemoryDependencies';
import type { Listing } from '../domain/entities/Listing';
import { BookparkingRxListingGateway } from './RealListingGateway';

export const createListingGatewaySut = () => {
  const httpClient = new InMemoryHttpClient();
  const gateway = new BookparkingRxListingGateway(httpClient);
  let received: unknown = null;
  let refusal: Error | null = null;

  return {
    givenTheApiAnswers(method: string, path: string, data: unknown): void {
      httpClient.feed(method, path, data);
    },
    givenTheApiRefuses(method: string, path: string, status: number, message: string): void {
      httpClient.fail(method, path, status, message);
    },
    aListing,
    async whenReadingTheActiveListings(): Promise<void> {
      received = await firstValueFrom(gateway.listActive());
    },
    async whenReadingTheListing(id: string): Promise<void> {
      try {
        received = await firstValueFrom(gateway.getById(id));
      } catch (error) {
        refusal = error as Error;
      }
    },
    async whenUnpublishing(id: string): Promise<void> {
      await firstValueFrom(gateway.unpublish(id));
    },
    async whenRepricing(id: string, dayInCents: number): Promise<void> {
      received = await firstValueFrom(gateway.updatePricing(id, { dayInCents }));
    },
    thenTheCallsWere(expected: { method: string; path: string }[]): void {
      const actual = httpClient.calls.map((call) => ({ method: call.method, path: call.path }));
      if (JSON.stringify(actual) !== JSON.stringify(expected))
        throw new Error(`Appels attendus ${JSON.stringify(expected)}, obtenus ${JSON.stringify(actual)}`);
    },
    thenTheBodySentWas(expected: unknown): void {
      const actual = httpClient.calls.at(-1)?.body;
      if (JSON.stringify(actual) !== JSON.stringify(expected))
        throw new Error(`Corps attendu ${JSON.stringify(expected)}, obtenu ${JSON.stringify(actual)}`);
    },
    thenTheListingsReadAre(count: number): void {
      const listings = received as Listing[];
      if (listings.length !== count)
        throw new Error(`Annonces attendues ${count}, obtenues ${listings.length}`);
    },
    thenTheDailyPriceReadIs(expected: number | null): void {
      const listing = received as Listing;
      if (listing.pricing.dayInCents !== expected)
        throw new Error(`Prix attendu ${String(expected)}, obtenu ${String(listing.pricing.dayInCents)}`);
    },
    thenTheRefusalMessageIs(expected: string): void {
      if (refusal === null) throw new Error('Aucun refus remonte');
      if (refusal.message !== expected)
        throw new Error(`Message attendu "${expected}", obtenu "${refusal.message}"`);
    },
  };
};
