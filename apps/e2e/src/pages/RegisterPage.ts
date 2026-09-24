import { expect, type Page } from '@playwright/test';

export class RegisterPage {
  constructor(private readonly page: Page) {}

  async open(): Promise<void> {
    await this.page.goto('/inscription');
    await expect(this.page.getByRole('heading', { level: 1, name: 'Créer un compte' })).toBeVisible();
  }

  async register(email: string, password: string): Promise<void> {
    await this.fill(email, password);
    await this.acceptTerms();
    await this.submit();
  }

  // Le premier pilote est proposé d'office : n'en choisir un que pour en changer.
  async chooseAvatar(name: string): Promise<void> {
    await this.page
      .getByRole('radiogroup', { name: 'Choisissez votre pilote' })
      .getByRole('radio', { name, exact: true })
      .check({ force: true });
  }

  async acceptTerms(): Promise<void> {
    await this.page.getByRole('checkbox', { name: /J’accepte les conditions d’utilisation/ }).check();
  }

  async expectTermsRequired(): Promise<void> {
    await expect(
      this.page.getByText('Cochez la case pour accepter les conditions d’utilisation.'),
    ).toBeVisible();
    await expect(this.page.getByRole('heading', { level: 1, name: 'Créer un compte' })).toBeVisible();
  }

  async fill(email: string, password: string): Promise<void> {
    await this.page.getByLabel('Adresse e-mail').fill(email);
    await this.page.getByLabel('Mot de passe', { exact: true }).fill(password);
    await this.page.getByLabel('Confirmer le mot de passe').fill(password);
  }

  // Le bouton reste désactivé tant que la preuve anti-robot n'est pas prête ;
  // `click` attend qu'il s'active.
  async submit(): Promise<void> {
    await this.page.locator('form').getByRole('button', { name: 'Créer mon compte' }).click();
  }

  async expectStrength(label: string): Promise<void> {
    await expect(
      this.page.getByRole('meter', { name: 'Robustesse du mot de passe' }),
    ).toHaveAttribute('aria-valuetext', label);
  }

  async expectHumanCheckPassed(): Promise<void> {
    await expect(this.page.getByRole('status').getByText('Vérifié : vous n’êtes pas un robot')).toBeVisible();
  }

  async expectEmailAlreadyUsed(): Promise<void> {
    await expect(this.page.getByText('Cette adresse e-mail est déjà utilisée')).toBeVisible();
  }
}
