import { expect, type Locator, type Page } from '@playwright/test';

export class DashboardPage {
  constructor(private readonly page: Page) {}

  private tab(name: string): Locator {
    return this.page.getByRole('tab', { name });
  }

  // La tuile porte son libellé comme nom accessible : c'est ce qui rapproche
  // une valeur de ce qu'elle mesure, et ce qui évite de confondre deux montants
  // identiques sur deux tuiles voisines. Le libellé est celui du DOM, pas celui
  // de l'écran : la majuscule vient d'une règle CSS.
  private metric(label: string): Locator {
    return this.page.getByRole('group', { name: label });
  }

  async open(): Promise<void> {
    await this.page.goto('/compte');
    await expect(this.page.getByRole('heading', { level: 1, name: 'Tableau de bord' })).toBeVisible();
  }

  async openTab(name: string): Promise<void> {
    await this.tab(name).click();
    await expect(this.tab(name)).toHaveAttribute('aria-selected', 'true');
  }

  async expectConfirmedRevenue(amountInEuros: string): Promise<void> {
    await expect(this.metric('Revenus confirmés')).toContainText(
      new RegExp(`${amountInEuros}\\s*€`),
    );
  }

  async expectPublishedPlaces(count: number): Promise<void> {
    await expect(this.metric('Places publiées')).toContainText(String(count));
  }

  listedPlace(address: string): Locator {
    return this.page.getByRole('listitem').filter({ hasText: address });
  }

  async confirmRequestFor(address: string): Promise<void> {
    await this.listedPlace(address).getByRole('button', { name: 'Confirmer' }).click();
  }

  async expectRequestLabel(address: string, label: RegExp): Promise<void> {
    await expect(this.listedPlace(address)).toContainText(label);
  }

  async expectRequestConfirmed(address: string): Promise<void> {
    await expect(this.listedPlace(address)).toContainText('Confirmée');
  }

  private cancellationDialog(): Locator {
    return this.page.getByRole('dialog', { name: 'Annuler cette réservation ?' });
  }

  // `exact` : « Annuler » est un préfixe de « Annuler la réservation », le
  // bouton de la fenêtre qui s'ouvre par-dessus la ligne.
  async startCancellingFor(address: string): Promise<void> {
    await this.listedPlace(address).getByRole('button', { name: 'Annuler', exact: true }).click();
    await expect(this.cancellationDialog()).toBeVisible();
  }

  async expectCancellationTerms(text: string | RegExp): Promise<void> {
    await expect(this.cancellationDialog()).toContainText(text);
  }

  async confirmCancellation(): Promise<void> {
    await this.cancellationDialog().getByRole('button', { name: 'Annuler la réservation' }).click();
    await expect(this.cancellationDialog()).toHaveCount(0);
  }

  async expectNoRequests(): Promise<void> {
    await expect(
      this.page.getByText("Personne n'a encore demandé l'une de vos places."),
    ).toBeVisible();
  }
}
