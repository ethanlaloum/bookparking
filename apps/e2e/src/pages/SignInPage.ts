import { expect, type Page } from '@playwright/test';

export class SignInPage {
  constructor(private readonly page: Page) {}

  async open(): Promise<void> {
    await this.page.goto('/connexion');
    await expect(this.page.getByRole('heading', { level: 1, name: 'Se connecter' })).toBeVisible();
  }

  async signIn(email: string, password: string): Promise<void> {
    await this.page.getByLabel('Adresse e-mail').fill(email);
    await this.page.getByLabel('Mot de passe').fill(password);
    // Le libellé « Se connecter » existe aussi dans l'en-tête : on le cherche
    // dans le formulaire, sinon le clic part sur le lien de navigation.
    await this.page.locator('form').getByRole('button', { name: 'Se connecter' }).click();
  }

  async expectRefusal(): Promise<void> {
    await expect(this.page.getByText('Adresse e-mail ou mot de passe incorrect')).toBeVisible();
  }
}
