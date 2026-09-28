import {
  StripeClient,
  stripeErrors,
} from '../../../../rental/adapters/services/stripe/stripeSdk';
import { PayoutUnavailableError } from '../../../domain/errors/PayoutUnavailableError';
import { PayoutProvider } from '../../../domain/ports/PayoutProvider';

// 7523 : « Parking Lots, Garages » dans la nomenclature des marchands.
const PARKING_MCC = '7523';

const isUnavailability = (error: unknown): boolean =>
  error instanceof stripeErrors.StripeConnectionError ||
  error instanceof stripeErrors.StripeAPIError ||
  error instanceof stripeErrors.StripeRateLimitError;

/**
 * Stripe Connect Express, en « charges et virements séparés » : le conducteur
 * paie la plateforme (`StripePaymentGateway`), puis la plateforme vire au
 * loueur sa part. Le loueur saisit son identité et son IBAN sur les pages de
 * Stripe (`onboardingLink`) ; l'api n'en voit rien. Le SDK s'importe depuis
 * `stripeSdk.ts` du contexte `rental`, seul point d'entrée autorisé.
 */
export class StripePayoutProvider implements PayoutProvider {
  constructor(
    private readonly stripe: StripeClient,
    private readonly frontBaseUrl: string,
  ) {}

  public async createAccount(params: {
    accountId: string;
    email: string | null;
    idempotencyKey: string;
  }): Promise<string> {
    const account = await this.call(() =>
      this.stripe.accounts.create(
        {
          type: 'express',
          country: 'FR',
          business_type: 'individual',
          ...(params.email === null ? {} : { email: params.email }),
          capabilities: { transfers: { requested: true } },
          business_profile: {
            mcc: PARKING_MCC,
            product_description:
              'Location de places de parking entre particuliers, sur Bookparking',
          },
          metadata: { accountId: params.accountId },
        },
        { idempotencyKey: params.idempotencyKey },
      ),
    );
    return account.id;
  }

  // Le retour et la relance mènent à l'onglet « Versements », qui relit l'état
  // du compte chez Stripe.
  public async onboardingLink(stripeAccountId: string): Promise<string> {
    const link = await this.call(() =>
      this.stripe.accountLinks.create({
        account: stripeAccountId,
        type: 'account_onboarding',
        refresh_url: `${this.frontBaseUrl}/compte?onglet=versements&stripe=relance`,
        return_url: `${this.frontBaseUrl}/compte?onglet=versements&stripe=retour`,
      }),
    );
    return link.url;
  }

  public async dashboardLink(stripeAccountId: string): Promise<string> {
    const link = await this.call(() =>
      this.stripe.accounts.createLoginLink(stripeAccountId),
    );
    return link.url;
  }

  public async payoutsEnabled(stripeAccountId: string): Promise<boolean> {
    const account = await this.call(() =>
      this.stripe.accounts.retrieve(stripeAccountId),
    );
    return account.payouts_enabled === true;
  }

  // Adossé au paiement du conducteur (`source_transaction`) : le virement part
  // quand cet argent est disponible, sans puiser dans le solde de la plateforme.
  public async transfer(params: {
    stripeAccountId: string;
    amountInCents: number;
    paymentId: string;
    requestId: string;
    idempotencyKey: string;
  }): Promise<string> {
    const intent = await this.call(() =>
      this.stripe.paymentIntents.retrieve(params.paymentId),
    );
    const charge =
      typeof intent.latest_charge === 'string'
        ? intent.latest_charge
        : (intent.latest_charge?.id ?? null);
    const transfer = await this.call(() =>
      this.stripe.transfers.create(
        {
          amount: params.amountInCents,
          currency: 'eur',
          destination: params.stripeAccountId,
          transfer_group: params.requestId,
          metadata: { requestId: params.requestId },
          ...(charge === null ? {} : { source_transaction: charge }),
        },
        { idempotencyKey: params.idempotencyKey },
      ),
    );
    return transfer.id;
  }

  private async call<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error: unknown) {
      if (isUnavailability(error)) throw new PayoutUnavailableError();
      throw error;
    }
  }
}
