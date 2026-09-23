import { randomUUID } from 'node:crypto';

import {
  ApiClient,
  type PublishListingInput,
  type SeededListing,
  type SeededUser,
} from './ApiClient';

const DAY = 86_400_000;

export const inDays = (days: number): string =>
  new Date(Date.now() + days * DAY).toISOString().slice(0, 10) + 'T00:00:00.000Z';

export const dayInDays = (days: number): string =>
  new Date(Date.now() + days * DAY).toISOString().slice(0, 10);

// Des rues réelles, avec leur code postal et leur ville : la carte géocode
// chaque annonce, et une adresse inventée ressortirait non située.
const NICE_STREETS = [
  'rue Barla',
  'avenue Malausséna',
  'avenue Jean Médecin',
  'boulevard Gambetta',
  'rue de France',
] as const;

export const uniqueAddress = (): string => {
  const street = NICE_STREETS[Math.floor(Math.random() * NICE_STREETS.length)];
  return `${String(Math.floor(Math.random() * 90) + 1)} ${street}, 06000 Nice`;
};

export const uniqueBox = (label: string): string =>
  `${label}-${randomUUID().slice(0, 6)}`;

/**
 * Aucun endpoint ne supprime un compte, et il n'existe pas de table
 * d'artefacts : le nettoyage se limite donc aux annonces, depubliees dans
 * l'ordre inverse. Les comptes restent, ce qui est sans effet — chaque email
 * est unique, et la base locale est ephemere.
 */
export class Seeder {
  private readonly listings: SeededListing[] = [];

  constructor(private readonly api: ApiClient) {}

  async user(label: string): Promise<SeededUser> {
    return this.api.registerUser(label);
  }

  async listing(
    owner: SeededUser,
    overrides: Partial<PublishListingInput> = {},
  ): Promise<SeededListing> {
    const input: PublishListingInput = {
      address: overrides.address ?? uniqueAddress(),
      box: overrides.box ?? uniqueBox('E2E'),
      accessDescription: overrides.accessDescription ?? 'Digicode 4321, deuxieme sous-sol.',
      photos: overrides.photos ?? ['e2e-photo-1.jpg'],
      acceptedVehicles: overrides.acceptedVehicles ?? ['voiture'],
      pricing: overrides.pricing ?? { dayInCents: 1500, weekInCents: 8000, monthInCents: 25000 },
      availability: overrides.availability ?? { from: inDays(1), to: inDays(120) },
    };

    const created = await this.api.publishListing(owner.token, input);
    this.listings.push(created);
    return created;
  }

  async cleanup(): Promise<void> {
    for (const listing of [...this.listings].reverse()) {
      try {
        await this.api.unpublishListing(listing.ownerToken, listing.id);
      } catch {
        /* un echec de nettoyage ne doit jamais ecraser la vraie raison d'un echec de test */
      }
    }
    this.listings.length = 0;
  }
}
