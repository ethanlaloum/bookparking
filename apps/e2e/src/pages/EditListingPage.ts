import { expect, type Page } from '@playwright/test';

const displayedDay = (isoDay: string): string => isoDay.split('-').reverse().join('/');

export class EditListingPage {
  constructor(private readonly page: Page) {}

  async openFromListing(): Promise<void> {
    await this.page.getByRole('link', { name: 'Modifier l’annonce' }).click();
    await expect(this.page.getByRole('heading', { level: 1, name: 'Modifier l’annonce' })).toBeVisible();
  }

  async open(listingId: string): Promise<void> {
    await this.page.goto(`/place/${listingId}/modifier`);
  }

  async expectFilledWith(input: {
    accessDescription: string;
    checkedVehicles: string[];
    uncheckedVehicles: string[];
    dayInEuros: string;
    from: string;
    to: string;
  }): Promise<void> {
    await expect(this.page.getByLabel('Consignes d’accès')).toHaveValue(input.accessDescription);
    for (const vehicle of input.checkedVehicles)
      await expect(this.page.getByLabel(vehicle, { exact: true })).toBeChecked();
    for (const vehicle of input.uncheckedVehicles)
      await expect(this.page.getByLabel(vehicle, { exact: true })).not.toBeChecked();
    await expect(this.page.getByLabel('Jour')).toHaveValue(input.dayInEuros);
    await expect(this.page.getByLabel('Disponible à partir du')).toHaveValue(displayedDay(input.from));
    await expect(this.page.getByLabel('Jusqu’au')).toHaveValue(displayedDay(input.to));
  }

  async change(input: {
    accessDescription: string;
    check: string[];
    uncheck: string[];
    dayInEuros: string;
    to: string;
  }): Promise<void> {
    await this.page.getByLabel('Consignes d’accès').fill(input.accessDescription);
    for (const vehicle of input.check) await this.page.getByLabel(vehicle, { exact: true }).check();
    for (const vehicle of input.uncheck) await this.page.getByLabel(vehicle, { exact: true }).uncheck();
    await this.page.getByLabel('Jour').fill(input.dayInEuros);
    await this.page.getByLabel('Jusqu’au').fill(input.to);
  }

  async addPhotos(paths: string[], expectedCount: number): Promise<void> {
    await this.page.getByLabel('Ajouter des photos').setInputFiles(paths);
    await expect(
      this.page.getByRole('img', { name: `Photo ${String(expectedCount)} de la place` }),
    ).toBeVisible();
  }

  async save(): Promise<void> {
    await this.page.getByRole('button', { name: 'Enregistrer les modifications' }).click();
  }

  async expectSaved(): Promise<void> {
    await expect(this.page.getByRole('heading', { level: 1, name: 'Annonce mise à jour.' })).toBeVisible();
  }

  async backToListing(): Promise<void> {
    await this.page.getByRole('link', { name: 'Voir l’annonce' }).click();
  }

  async expectNotEditable(): Promise<void> {
    await expect(
      this.page.getByRole('heading', { level: 1, name: 'Cette annonce ne peut pas être modifiée.' }),
    ).toBeVisible();
    await expect(this.page.getByLabel('Consignes d’accès')).toHaveCount(0);
  }
}
