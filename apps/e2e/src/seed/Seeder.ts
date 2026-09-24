import { randomUUID } from 'node:crypto';

import type { Page } from '@playwright/test';

import { StripeCheckoutPage } from '../pages/StripeCheckoutPage';

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

// Stripe refuse les domaines réservés comme `.test` : la page de paiement
// reçoit une adresse sur example.com, sans lien avec le compte bookparking.
export const checkoutEmail = (): string => `e2e-${randomUUID().slice(0, 8)}@example.com`;

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

  /**
   * Une demande n'atteint le propriétaire qu'une fois l'empreinte posée, et
   * seule une vraie page de paiement Stripe la pose : il n'existe aucun
   * raccourci par l'api, et c'est voulu. La demande est payée avec la carte de
   * test, puis attendue jusqu'à ce que l'événement relayé par `stripe listen`
   * la fasse passer au propriétaire.
   */
  async paidRentalRequest(
    page: Page,
    renter: SeededUser,
    listing: SeededListing,
    days: { fromDay: string; toDay: string },
  ): Promise<string> {
    const { id, checkoutUrl } = await this.api.requestRental(renter.token, {
      address: listing.address,
      box: listing.box,
      ...days,
    });
    await page.goto(checkoutUrl);
    await new StripeCheckoutPage(page).payWithTestCard(checkoutEmail());

    const deadline = Date.now() + 60_000;
    while (Date.now() < deadline) {
      const request = (await this.api.myRequests(renter.token)).find(
        (candidate) => candidate.id === id,
      );
      if (request?.status === 'PENDING') return id;
      await new Promise((sleep) => setTimeout(sleep, 1000));
    }
    throw new Error(`La demande ${id} n'a pas reçu son empreinte en 60 s : stripe listen tourne-t-il ?`);
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
