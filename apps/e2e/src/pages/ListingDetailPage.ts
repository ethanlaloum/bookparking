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
    return this.page.getByRole('button', { name: 'Continuer vers le paiement' });
  }

  async expectPhotoShown(position: number, total: number): Promise<void> {
    const photo = this.page.getByRole('img', {
      name: `Photo ${String(position)} sur ${String(total)} de la place`,
    });
    await expect(photo).toBeVisible();
    await expect
      .poll(() => photo.evaluate((image: HTMLImageElement) => image.naturalWidth))
      .toBeGreaterThan(0);
  }

  async showPhoto(position: number): Promise<void> {
    await this.page.getByRole('button', { name: `Voir la photo ${String(position)}` }).click();
  }

  async expectOpen(address: string): Promise<void> {
    await expect(this.page.getByRole('heading', { level: 1, name: new RegExp(address) })).toBeVisible();
  }

  async expectPeriod(fromDay: string, toDay: string): Promise<void> {
    const displayed = (isoDay: string): string => isoDay.split('-').reverse().join('/');
    await expect(this.arrival()).toHaveValue(displayed(fromDay));
    await expect(this.departure()).toHaveValue(displayed(toDay));
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

  async continueToPayment(): Promise<void> {
    await this.bookButton().click();
  }

  async doubleClickContinueToPayment(): Promise<void> {
    await this.bookButton().dblclick();
  }

  async expectNothingWasHeld(): Promise<void> {
    await expect(
      this.page.getByText('Paiement abandonné : rien n’a été réservé sur votre carte.'),
    ).toBeVisible();
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

  async expectAcceptedVehicles(vehicles: string[]): Promise<void> {
    const section = this.page
      .locator('section')
      .filter({ has: this.page.getByRole('heading', { name: 'Véhicules acceptés' }) });
    await expect(section.getByRole('listitem')).toHaveText(vehicles);
  }

  async expectPrice(tier: string, euros: string): Promise<void> {
    const cell = this.page
      .locator('dl > div')
      .filter({ has: this.page.getByRole('term').filter({ hasText: new RegExp(`^${tier}$`) }) });
    await expect(cell.getByRole('definition')).toHaveText(new RegExp(`^${euros}\\s*\u20ac$`));
  }
}
