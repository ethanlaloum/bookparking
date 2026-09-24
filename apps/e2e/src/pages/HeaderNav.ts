import { expect, type Page } from '@playwright/test';

export class HeaderNav {
  constructor(private readonly page: Page) {}

  async expectSignedIn(): Promise<void> {
    await expect(this.page.getByRole('link', { name: 'Mon compte' })).toBeVisible();
  }

  // L'avatar de l'en-tête est décoratif (le lien garde son nom « Mon compte ») :
  // on le reconnaît à son dessin découpé, que l'icône générique n'a pas.
  async expectAvatar(): Promise<void> {
    await expect(
      this.page.getByRole('link', { name: 'Mon compte' }).locator('svg:has(clipPath)'),
    ).toHaveCount(1);
  }

  async openAccount(): Promise<void> {
    await this.page.getByRole('link', { name: 'Mon compte' }).click();
  }

  async expectSignedOut(): Promise<void> {
    await expect(this.page.getByRole('link', { name: 'Se connecter' })).toBeVisible();
  }
}
