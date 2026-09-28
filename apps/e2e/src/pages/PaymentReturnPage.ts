import { expect, type Page } from '@playwright/test';

export class PaymentReturnPage {
  constructor(private readonly page: Page) {}

  async expectRequestSent(): Promise<void> {
    await expect(this.page.getByRole('heading', { level: 1, name: 'Demande envoyée' })).toBeVisible({
      timeout: 60_000,
    });
    await expect(this.page.getByRole('status').filter({ hasText: 'Carte vérifiée' })).toContainText(
      'Empreinte posée, rien n’est prélevé',
    );
  }

  async openMyRequests(): Promise<void> {
    await this.page.getByRole('link', { name: 'Voir mes demandes' }).click();
  }
}
