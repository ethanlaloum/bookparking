import { expect, type Locator, type Page } from '@playwright/test';

export class ListingsPage {
  constructor(private readonly page: Page) {}

  card(address: string): Locator {
    return this.page.getByRole('listitem').filter({ hasText: address });
  }

  searchField(): Locator {
    return this.page.getByLabel('Rechercher une adresse ou un box');
  }

  async open(): Promise<void> {
    await this.page.goto('/');
    await expect(this.page.getByRole('heading', { name: 'Places disponibles' })).toBeVisible();
  }

  async search(text: string): Promise<void> {
    await this.searchField().fill(text);
  }

  async openListing(address: string): Promise<void> {
    await this.card(address).getByRole('link').first().click();
  }

  async expectListed(address: string): Promise<void> {
    await expect(this.card(address)).toBeVisible();
  }

  async expectNotListed(address: string): Promise<void> {
    await expect(this.card(address)).toHaveCount(0);
  }
}
