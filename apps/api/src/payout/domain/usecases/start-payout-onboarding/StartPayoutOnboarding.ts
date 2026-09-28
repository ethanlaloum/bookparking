import { Either } from 'effect/index';

import { UnknownError } from '../../../../shared/error/errors/UnknownError';
import { UseCase } from '../../../../shared/use-case/UseCase';
import { PayoutUnavailableError } from '../../errors/PayoutUnavailableError';
import { PayoutProvider } from '../../ports/PayoutProvider';
import { PayoutRepository } from '../../ports/PayoutRepository';

interface Props {
  accountId: string;
  now: Date;
}

// Une clé par compte : deux clics concurrents ne créent qu'un compte Stripe.
export const payoutAccountIdempotencyKeyOf = (accountId: string): string =>
  `payout-account-${accountId}`;

/**
 * Ouvre l'inscription du loueur chez Stripe : identité et IBAN s'y saisissent,
 * sur une page de Stripe, jamais sur celles de Bookparking. Le compte Stripe
 * Connect est créé au premier appel, puis réutilisé ; chaque appel rend un
 * lien neuf, Stripe n'en gardant un que quelques minutes.
 */
export class StartPayoutOnboarding implements UseCase<
  Props,
  Promise<Either.Either<string, PayoutUnavailableError | UnknownError>>
> {
  constructor(
    private readonly payoutRepository: PayoutRepository,
    private readonly payoutProvider: PayoutProvider,
  ) {}

  public async execute(
    props: Props,
  ): Promise<Either.Either<string, PayoutUnavailableError | UnknownError>> {
    try {
      let account = await this.payoutRepository.findAccount(props.accountId);
      if (account === null) {
        const stripeAccountId = await this.payoutProvider.createAccount({
          accountId: props.accountId,
          email: await this.payoutRepository.findEmailOf(props.accountId),
          idempotencyKey: payoutAccountIdempotencyKeyOf(props.accountId),
        });
        await this.payoutRepository.createAccount(
          {
            accountId: props.accountId,
            stripeAccountId,
            payoutsEnabled: false,
          },
          props.now,
        );
        account = (await this.payoutRepository.findAccount(
          props.accountId,
        )) ?? {
          accountId: props.accountId,
          stripeAccountId,
          payoutsEnabled: false,
        };
      }
      return Either.right(
        await this.payoutProvider.onboardingLink(account.stripeAccountId),
      );
    } catch (error: unknown) {
      if (error instanceof PayoutUnavailableError) return Either.left(error);
      return Either.left(
        new UnknownError(
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
  }
}
