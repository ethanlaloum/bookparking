import { firstValueFrom } from 'rxjs';

import { InMemoryHttpClient } from '../../../lib/http/InMemoryHttpClient';
import { aListing, anOwnerListing } from '../../../store/testing/InMemoryDependencies';
import type { Listing } from '../domain/entities/Listing';
import type { LocalPhoto } from '../domain/entities/ListingPhoto';
import type { SearchedStay } from '../domain/entities/SearchCriteria';
import type { EditListingPayload, OwnerListing } from '../domain/ports/ListingGateway';
import { BookparkingRxListingGateway } from './RealListingGateway';

export const createListingGatewaySut = () => {
  const httpClient = new InMemoryHttpClient();
  const formParts: LocalPhoto[] = [];
  const gateway = new BookparkingRxListingGateway(httpClient, (photo) => {
    formParts.push(photo);
    return Promise.resolve(new Blob([photo.uri], { type: photo.type }));
  });
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
    anOwnerListing,
    async whenReadingTheActiveListings(): Promise<void> {
      received = await firstValueFrom(gateway.listActive());
    },
    async whenReadingTheFreeListings(stay: SearchedStay): Promise<void> {
      received = await firstValueFrom(gateway.listFree(stay));
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
    async whenUploading(photo: LocalPhoto): Promise<void> {
      received = await firstValueFrom(gateway.uploadPhoto(photo));
    },
    async thenTheFormSentCarries(expected: { field: string; fileName: string; content: string }): Promise<void> {
      const form = httpClient.calls.at(-1)?.body;
      if (!(form instanceof FormData)) throw new Error('Aucun formulaire multipart envoye');
      const fields = [...form.keys()];
      const file = form.get(expected.field);
      if (!(file instanceof File)) throw new Error(`Aucun fichier dans ${expected.field}, champs ${fields.join(',')}`);
      const actual = { fields, fileName: file.name, content: await file.text() };
      const wanted = { fields: [expected.field], fileName: expected.fileName, content: expected.content };
      if (JSON.stringify(actual) !== JSON.stringify(wanted))
        throw new Error(`Formulaire attendu ${JSON.stringify(wanted)}, obtenu ${JSON.stringify(actual)}`);
    },
    thenThePhotosTurnedIntoFormPartsAre(expected: LocalPhoto[]): void {
      if (JSON.stringify(formParts) !== JSON.stringify(expected))
        throw new Error(`Photos attendues ${JSON.stringify(expected)}, obtenues ${JSON.stringify(formParts)}`);
    },
    thenThePhotoIdReadIs(expected: string): void {
      if (received !== expected) throw new Error(`Identifiant attendu ${expected}, obtenu ${String(received)}`);
    },
    async whenEditing(id: string, listing: EditListingPayload): Promise<void> {
      received = await firstValueFrom(gateway.edit(id, listing));
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
    thenTheListingReadIs(expected: OwnerListing): void {
      if (JSON.stringify(received) !== JSON.stringify(expected))
        throw new Error(`Annonce attendue ${JSON.stringify(expected)}, obtenue ${JSON.stringify(received)}`);
    },
    thenTheRefusalMessageIs(expected: string): void {
      if (refusal === null) throw new Error('Aucun refus remonte');
      if (refusal.message !== expected)
        throw new Error(`Message attendu "${expected}", obtenu "${refusal.message}"`);
    },
  };
};
