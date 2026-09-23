const STRIPE_CHECKOUT_ORIGIN = 'https://checkout.stripe.com';

/**
 * Le front ne quitte bookparking que pour la page de paiement de Stripe. Une
 * comparaison de préfixe laisserait passer `https://checkout.stripe.com.exemple.fr`
 * ; seule l'origine analysée fait foi.
 */
export const isStripeCheckoutUrl = (url: string): boolean => {
  try {
    return new URL(url).origin === STRIPE_CHECKOUT_ORIGIN;
  } catch {
    return false;
  }
};
