import { expect, type Page } from '@playwright/test';

const CHECKOUT = /^https:\/\/checkout\.stripe\.com\//;

/**
 * La page de paiement de Stripe, en mode test. Ce n'est pas une page de
 * bookparking : ses noms accessibles ne sont pas un contrat que ce dépôt tient,
 * d'où les identifiants de champ que Stripe Checkout garde stables
 * (`#cardNumber`, `#cardExpiry`…) plutôt que des libellés traduits.
 */
export class StripeCheckoutPage {
  constructor(private readonly page: Page) {}

  async expectOpen(): Promise<void> {
    await expect(this.page).toHaveURL(CHECKOUT);
  }

  // Le montant s'écrit avec une espace insécable avant l'euro, comme sur le
  // front : n'importe quelle espace est tolérée.
  async expectAmount(amountInEuros: string): Promise<void> {
    await expect(
      this.page.getByText(new RegExp(`${amountInEuros.replace(',', ',')}\\s*€`)).first(),
    ).toBeVisible();
  }

  async payWithTestCard(email: string): Promise<void> {
    await this.expectOpen();
    await this.page.locator('#email').fill(email);
    await this.page.locator('#cardNumber').fill('4242 4242 4242 4242');
    await this.page.locator('#cardExpiry').fill('12 / 34');
    await this.page.locator('#cardCvc').fill('123');
    await this.page.locator('#billingName').fill('Léa T.');
    await this.page.getByTestId('hosted-payment-submit-button').click();
    await expect(this.page).not.toHaveURL(CHECKOUT, { timeout: 60_000 });
  }

  async leaveWithoutPaying(): Promise<void> {
    await this.expectOpen();
    await this.page.getByTestId('business-link').click();
    await expect(this.page).not.toHaveURL(CHECKOUT);
  }
}
