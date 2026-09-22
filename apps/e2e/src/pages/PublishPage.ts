import { expect, type Page } from '@playwright/test';

export class PublishPage {
  constructor(private readonly page: Page) {}

  async open(): Promise<void> {
    await this.page.goto('/publier');
    await expect(this.page.getByRole('heading', { level: 1, name: 'Publier une place' })).toBeVisible();
  }

  async fill(input: {
    address: string;
    box: string;
    accessDescription: string;
    photos: string;
    dayInEuros: string;
    from: string;
    to: string;
  }): Promise<void> {
    await this.page.getByLabel('Adresse').fill(input.address);
    await this.page.getByLabel('Numéro de box').fill(input.box);
    await this.page.getByLabel('Consignes d’accès').fill(input.accessDescription);
    await this.page.getByLabel('Photos').fill(input.photos);
    await this.page.getByLabel('Jour').fill(input.dayInEuros);
    await this.page.getByLabel('Disponible à partir du').fill(input.from);
    await this.page.getByLabel('Jusqu’au').fill(input.to);
  }

  async submit(): Promise<void> {
    await this.page.getByRole('button', { name: 'Publier l’annonce' }).click();
  }

  async expectPublished(): Promise<void> {
    await expect(this.page.getByText('Votre annonce est en ligne.')).toBeVisible();
  }
}
