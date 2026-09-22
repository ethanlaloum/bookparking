import { expect, type Locator, type Page } from '@playwright/test';

export class MapPage {
  constructor(private readonly page: Page) {}

  private map(): Locator {
    return this.page.locator('.leaflet-container');
  }

  marker(address: string): Locator {
    // Le titre du marqueur porte l'adresse : c'est aussi l'infobulle que voit
    // un utilisateur au survol, donc un vrai nom et non un crochet de test.
    return this.map().locator(`[title^="${address}"]`);
  }

  async open(): Promise<void> {
    await this.page.goto('/carte');
    await expect(this.page.getByRole('heading', { level: 1, name: 'Carte des places' })).toBeVisible();
  }

  async expectMapVisible(): Promise<void> {
    await expect(this.map()).toBeVisible();
  }

  async expectPlacedCount(count: number): Promise<void> {
    await expect(this.page.getByText(new RegExp(`^${String(count)} places? situées?$`))).toBeVisible();
  }

  async openPopupFor(address: string): Promise<void> {
    await this.marker(address).first().click();
  }

  async expectPopupShows(text: string): Promise<void> {
    await expect(this.page.locator('.leaflet-popup-content')).toContainText(text);
  }

  async followListingFromPopup(): Promise<void> {
    await this.page.locator('.leaflet-popup-content').getByRole('link', { name: "Voir l'annonce" }).click();
  }
}
