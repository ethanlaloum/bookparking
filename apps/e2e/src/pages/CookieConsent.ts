import { expect, type Locator, type Page } from '@playwright/test';

export type Purpose = 'Carte (OpenStreetMap)' | 'Polices (Google Fonts)';

const TITLE = 'Cookies et contenus tiers';

export class CookieConsent {
  constructor(private readonly page: Page) {}

  banner(): Locator {
    return this.page.getByRole('region', { name: TITLE });
  }

  settings(): Locator {
    return this.page.getByRole('dialog', { name: TITLE });
  }

  mapPlaceholder(): Locator {
    return this.page.getByRole('heading', { name: 'La carte attend votre accord' });
  }

  purpose(name: Purpose): Locator {
    return this.settings().getByRole('switch', { name, exact: true });
  }

  async acceptAll(): Promise<void> {
    await this.banner().getByRole('button', { name: 'Tout accepter' }).click();
    await expect(this.banner()).toHaveCount(0);
  }

  async refuseAll(): Promise<void> {
    await this.banner().getByRole('button', { name: 'Tout refuser' }).click();
    await expect(this.banner()).toHaveCount(0);
  }

  // Le lien du pied de page, et non le bandeau : c'est le seul chemin qui
  // reste une fois la décision prise.
  async openSettingsFromFooter(): Promise<void> {
    await this.page.getByRole('button', { name: 'Gérer les cookies' }).click();
    await expect(this.settings()).toBeVisible();
  }

  async setPurpose(name: Purpose, allowed: boolean): Promise<void> {
    const toggle = this.purpose(name);
    if ((await toggle.getAttribute('aria-checked')) !== String(allowed)) await toggle.click();
    await expect(toggle).toHaveAttribute('aria-checked', String(allowed));
  }

  async expectPurpose(name: Purpose, allowed: boolean): Promise<void> {
    await expect(this.purpose(name)).toHaveAttribute('aria-checked', String(allowed));
  }

  async save(): Promise<void> {
    await this.settings().getByRole('button', { name: 'Enregistrer mes choix' }).click();
    await expect(this.settings()).toHaveCount(0);
  }

  async showMapFromPlaceholder(): Promise<void> {
    await this.page.getByRole('button', { name: 'Afficher la carte' }).click();
  }
}

const THIRD_PARTIES = {
  fonts: ['fonts.googleapis.com', 'fonts.gstatic.com'],
  map: ['tile.openstreetmap.org'],
} as const;

/**
 * Relève chaque requête vers les tiers soumis au consentement, depuis
 * l'ouverture de la page. À brancher avant la première navigation : une
 * requête partie avant l'écoute échapperait au relevé, et le test conclurait
 * à tort qu'elle n'a pas eu lieu.
 */
export const watchThirdParties = (page: Page) => {
  const seen: { fonts: string[]; map: string[] } = { fonts: [], map: [] };
  page.on('request', (request) => {
    const host = new URL(request.url()).hostname;
    for (const purpose of ['fonts', 'map'] as const) {
      if (THIRD_PARTIES[purpose].some((domain) => host === domain || host.endsWith(`.${domain}`)))
        seen[purpose].push(request.url());
    }
  });
  return seen;
};
