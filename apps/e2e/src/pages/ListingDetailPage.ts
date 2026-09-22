import { expect, type Locator, type Page } from '@playwright/test';

export class ListingDetailPage {
  constructor(private readonly page: Page) {}

  private arrival(): Locator {
    return this.page.getByLabel('Arrivée');
  }

  private departure(): Locator {
    return this.page.getByLabel('Départ');
  }

  bookButton(): Locator {
    return this.page.getByRole('button', { name: 'Demander la réservation' });
  }

  async expectOpen(address: string): Promise<void> {
    await expect(this.page.getByRole('heading', { level: 1, name: new RegExp(address) })).toBeVisible();
  }

  async choosePeriod(fromDay: string, toDay: string): Promise<void> {
    await this.arrival().fill(fromDay);
    await this.departure().fill(toDay);
  }

  /**
   * `Intl.NumberFormat('fr-FR')` separe le montant de son symbole par une
   * espace fine insecable (U+202F), invisible mais fatale a une comparaison
   * exacte : on tolere donc n'importe quelle espace entre les deux.
   */
  async expectEstimate(amountInEuros: string): Promise<void> {
    await expect(this.page.getByText('Estimation')).toBeVisible();
    await expect(
      this.page.getByText(new RegExp(`^${amountInEuros}\\s*\u20ac$`)).first(),
    ).toBeVisible();
  }

  async expectNoPriceCoversPeriod(): Promise<void> {
    await expect(this.page.getByText('Aucun tarif ne couvre cette période.')).toBeVisible();
  }

  async requestRental(): Promise<void> {
    await this.bookButton().click();
  }

  async expectRequestSent(): Promise<void> {
    await expect(this.page.getByText('Demande envoyée')).toBeVisible();
  }

  async unpublish(): Promise<void> {
    await this.page.getByRole('button', { name: 'Dépublier' }).click();
  }

  async expectNotOwnedRefusal(): Promise<void> {
    await expect(this.page.getByText('Cette annonce ne vous appartient pas')).toBeVisible();
  }

  async expectPricingTier(tier: string, value: string): Promise<void> {
    const cell = this.page.getByRole('term').filter({ hasText: tier });
    await expect(cell).toBeVisible();
    await expect(this.page.getByText(value, { exact: true }).first()).toBeVisible();
  }
}
