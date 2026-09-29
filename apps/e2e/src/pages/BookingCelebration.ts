import { expect, type Locator, type Page } from '@playwright/test';

export class BookingCelebration {
  constructor(private readonly page: Page) {}

  private dialog(): Locator {
    return this.page.getByRole('dialog', { name: 'C’est réservé !' });
  }

  async expectShownThenClose(): Promise<void> {
    await expect(this.dialog()).toBeVisible();
    await this.dialog().getByRole('button', { name: 'Fermer' }).click();
    await expect(this.dialog()).toHaveCount(0);
  }
}
