// Le SDK de Stripe s'exporte par `export =`, et l'api compile en CommonJS sans
// `esModuleInterop` : `import Stripe from 'stripe'` compile, puis lit un
// `.default` qui n'existe pas et plante au démarrage. La seule forme juste est
// `import … = require(…)`, que la règle du dépôt interdit ailleurs ; elle vit
// donc ici, une fois, et le reste du code importe ce module.
// eslint-disable-next-line @typescript-eslint/no-require-imports
import StripeSdk = require('stripe');

export type StripeClient = StripeSdk.Stripe;
export type StripeEvent = StripeSdk.Event;
export type StripePaymentIntent = StripeSdk.PaymentIntent;
export type StripeCheckoutSession = StripeSdk.Checkout.Session;

export const createStripeClient = (secretKey: string): StripeClient =>
  new StripeSdk(secretKey);

export const stripeErrors = StripeSdk.errors;
