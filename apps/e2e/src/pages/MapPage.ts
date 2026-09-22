import { expect, type Locator, type Page } from '@playwright/test';

export class MapPage {
  constructor(private readonly page: Page) {}

  private map(): Locator {
    return this.page.locator('.leaflet-container');
  }

  // Leaflet expose un marqueur comme un bouton dont le `title` devient le nom
  // accessible : « <adresse> — <box> ». On le désigne donc par son rôle, comme
  // tout le reste, sans descendre au sélecteur CSS.
  marker(address: string): Locator {
    return this.page.getByRole('button', { name: new RegExp(`^${address}`) });
  }

  searchField(): Locator {
    return this.page.getByRole('combobox', { name: 'Rechercher une adresse à Nice' });
  }

  suggestion(label: string): Locator {
    return this.page.getByRole('option', { name: label });
  }

  async searchAddress(query: string, pick: string): Promise<void> {
    await this.searchField().fill(query);
    await this.suggestion(pick).click();
  }

  async expectSearchSummary(text: string | RegExp): Promise<void> {
    await expect(this.page.getByText(text)).toBeVisible();
  }

  async clearSearch(): Promise<void> {
    await this.page.getByRole('button', { name: 'Effacer la recherche' }).click();
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
