import { expect, type Locator, type Page } from '@playwright/test';

export class SearchPage {
  constructor(private readonly page: Page) {}

  private map(): Locator {
    return this.page.locator('.leaflet-container');
  }

  // Leaflet expose un marqueur comme un bouton dont le `title` devient le nom
  // accessible : « <adresse> — <box> ». On le désigne donc par son rôle, comme
  // tout le reste, sans descendre au sélecteur CSS.
  // La liste des places occupe la colonne gauche de cette même page : c'est
  // la page recherche qui la porte depuis que l'accueil est une page
  // d'atterrissage.
  resultCard(address: string): Locator {
    return this.page.getByRole('listitem').filter({ hasText: address });
  }

  async expectListed(address: string): Promise<void> {
    await expect(this.resultCard(address)).toBeVisible();
  }

  async expectNotListed(address: string): Promise<void> {
    await expect(this.resultCard(address)).toHaveCount(0);
  }

  async openListingFromList(address: string): Promise<void> {
    await this.resultCard(address).getByRole('link', { name: "Voir l'annonce" }).click();
  }

  marker(address: string): Locator {
    return this.page.getByRole('button', { name: new RegExp(`^${address}`) });
  }

  searchField(): Locator {
    return this.page.getByRole('combobox', { name: 'Rechercher une adresse à Nice' });
  }

  suggestion(label: string): Locator {
    return this.page.getByRole('option', { name: label });
  }

  // Choisir une suggestion renseigne le formulaire ; c'est « Rechercher » qui
  // lance la recherche. Un utilisateur qui veut chercher fait les trois gestes,
  // ce parcours aussi.
  async searchAddress(query: string, pick: string): Promise<void> {
    await this.searchField().fill(query);
    await this.suggestion(pick).click();
    await this.submit();
  }

  async expectSearchSummary(text: string | RegExp): Promise<void> {
    await expect(this.page.getByText(text)).toBeVisible();
  }

  // Le véhicule et la durée ne sont plus des `<select>` natifs mais des
  // listes déroulantes au motif ARIA « select-only combobox » : un déclencheur
  // `role="combobox"` nommé par son libellé, une liste de `role="option"`. On
  // les manœuvre comme un utilisateur — ouvrir, puis choisir l'option par son
  // nom — et on lit la valeur retenue dans le texte du déclencheur.
  // `exact` : « Voiture » est un préfixe de « Voiture électrique ».
  vehicleSelect(): Locator {
    return this.page.getByRole('combobox', { name: 'Véhicule', exact: true });
  }

  durationSelect(): Locator {
    return this.page.getByRole('combobox', { name: 'Durée', exact: true });
  }

  async chooseVehicle(label: string): Promise<void> {
    await this.vehicleSelect().click();
    await this.page.getByRole('option', { name: label, exact: true }).click();
  }

  async chooseDuration(label: string): Promise<void> {
    await this.durationSelect().click();
    await this.page.getByRole('option', { name: label, exact: true }).click();
  }

  async expectVehicle(label: string): Promise<void> {
    await expect(this.vehicleSelect()).toHaveText(label);
  }

  async expectDuration(label: string): Promise<void> {
    await expect(this.durationSelect()).toHaveText(label);
  }

  async submit(): Promise<void> {
    await this.page.getByRole('button', { name: 'Rechercher', exact: true }).click();
  }

  // Le ✕ efface le champ ; c'est « Rechercher » qui applique. Abandonner une
  // recherche, c'est donc vider puis valider — deux gestes, comme dans
  // n'importe quel formulaire.
  async abandonSearch(): Promise<void> {
    await this.page.getByRole('button', { name: "Effacer l'adresse" }).click();
    await this.submit();
  }

  async open(): Promise<void> {
    await this.page.goto('/recherche');
    await expect(this.page.getByRole('heading', { level: 1, name: 'Rechercher une place' })).toBeVisible();
  }

  async expectMapVisible(): Promise<void> {
    await expect(this.map()).toBeVisible();
  }

  async expectPlacedCount(count: number): Promise<void> {
    await expect(this.page.getByText(new RegExp(`^${String(count)} places? situées?$`))).toBeVisible();
  }

  async openPopupFor(address: string): Promise<void> {
    await this.marker(address).first().click();
  }

  async expectPopupShows(text: string): Promise<void> {
    await expect(this.page.locator('.leaflet-popup-content')).toContainText(text);
  }

  async followListingFromPopup(): Promise<void> {
    await this.page.locator('.leaflet-popup-content').getByRole('link', { name: "Voir l'annonce" }).click();
  }
}
