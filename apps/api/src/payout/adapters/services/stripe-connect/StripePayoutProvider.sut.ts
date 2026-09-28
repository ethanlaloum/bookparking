import {
  StripeClient,
  stripeErrors,
} from '../../../../rental/adapters/services/stripe/stripeSdk';
import { StripePayoutProvider } from './StripePayoutProvider';

interface Call {
  method: string;
  args: unknown[];
}

// Un faux client Stripe : il note chaque appel et rend ce qu'on lui dit. Seules
// les méthodes que l'adaptateur appelle existent.
export const createStripePayoutProviderSUT = () => {
  const calls: Call[] = [];
  let failure: unknown = null;
  let latestCharge: unknown = 'ch_lea';
  let payoutsEnabled = true;

  const record =
    <T>(method: string, answer: () => T) =>
    async (...args: unknown[]): Promise<T> => {
      calls.push({ method, args });
      if (failure !== null) throw failure;
      return answer();
    };

  const fakeStripe = {
    accounts: {
      create: record('accounts.create', () => ({ id: 'acct_marc' })),
      retrieve: record('accounts.retrieve', () => ({
        payouts_enabled: payoutsEnabled,
      })),
      createLoginLink: record('accounts.createLoginLink', () => ({
        url: 'https://connect.stripe.com/express/acct_marc',
      })),
    },
    accountLinks: {
      create: record('accountLinks.create', () => ({
        url: 'https://connect.stripe.com/setup/e/acct_marc/abc',
      })),
    },
    paymentIntents: {
      retrieve: record('paymentIntents.retrieve', () => ({
        latest_charge: latestCharge,
      })),
    },
    transfers: {
      create: record('transfers.create', () => ({ id: 'tr_lea' })),
    },
  } as unknown as StripeClient;

  const provider = new StripePayoutProvider(
    fakeStripe,
    'https://bookparking.fr',
  );

  return {
    provider,

    givenTheLatestChargeIs(charge: unknown) {
      latestCharge = charge;
    },

    givenPayoutsEnabled(enabled: boolean) {
      payoutsEnabled = enabled;
    },

    givenStripeCannotBeReached() {
      failure = new stripeErrors.StripeConnectionError({
        message: 'socket hang up',
      });
    },

    givenStripeRefuses() {
      failure = new stripeErrors.StripeInvalidRequestError({
        message: 'No such account',
      });
    },

    thenCallIs(method: string, expected: unknown[]) {
      expect(calls.find((call) => call.method === method)?.args).toEqual(
        expected,
      );
    },
  };
};
