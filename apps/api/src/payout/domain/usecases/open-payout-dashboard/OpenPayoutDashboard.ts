import { Either } from 'effect/index';

import { UnknownError } from '../../../../shared/error/errors/UnknownError';
import { UseCase } from '../../../../shared/use-case/UseCase';
import { PayoutAccountNotReadyError } from '../../errors/PayoutAccountNotReadyError';
import { PayoutUnavailableError } from '../../errors/PayoutUnavailableError';
import { PayoutProvider } from '../../ports/PayoutProvider';
import { PayoutRepository } from '../../ports/PayoutRepository';

interface Props {
  accountId: string;
}

type Failure =
  PayoutAccountNotReadyError | PayoutUnavailableError | UnknownError;

// L'espace Stripe du loueur : son IBAN, ses virements vers sa banque. Stripe
// ne l'ouvre qu'à un compte validé.
export class OpenPayoutDashboard implements UseCase<
  Props,
  Promise<Either.Either<string, Failure>>
> {
  constructor(
    private readonly payoutRepository: PayoutRepository,
    private readonly payoutProvider: PayoutProvider,
  ) {}

  public async execute(props: Props): Promise<Either.Either<string, Failure>> {
    try {
      const account = await this.payoutRepository.findAccount(props.accountId);
      if (account === null || !account.payoutsEnabled)
        return Either.left(new PayoutAccountNotReadyError());
      return Either.right(
        await this.payoutProvider.dashboardLink(account.stripeAccountId),
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
