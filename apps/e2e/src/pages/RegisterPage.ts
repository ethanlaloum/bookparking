import { expect, type Page } from '@playwright/test';

export class RegisterPage {
  constructor(private readonly page: Page) {}

  async open(): Promise<void> {
    await this.page.goto('/inscription');
    await expect(this.page.getByRole('heading', { level: 1, name: 'Créer un compte' })).toBeVisible();
  }

  async register(email: string, password: string): Promise<void> {
    await this.page.getByLabel('Adresse e-mail').fill(email);
    await this.page.getByLabel('Mot de passe').fill(password);
    await this.page.locator('form').getByRole('button', { name: 'Créer mon compte' }).click();
  }

  async expectEmailAlreadyUsed(): Promise<void> {
    await expect(this.page.getByText('Cette adresse e-mail est déjà utilisée')).toBeVisible();
  }
}
