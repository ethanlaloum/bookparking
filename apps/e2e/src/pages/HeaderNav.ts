import { expect, type Page } from '@playwright/test';

export class HeaderNav {
  constructor(private readonly page: Page) {}

  async expectSignedIn(): Promise<void> {
    await expect(this.page.getByRole('link', { name: 'Mon compte' })).toBeVisible();
  }

  async expectSignedOut(): Promise<void> {
    await expect(this.page.getByRole('link', { name: 'Se connecter' })).toBeVisible();
  }
}
