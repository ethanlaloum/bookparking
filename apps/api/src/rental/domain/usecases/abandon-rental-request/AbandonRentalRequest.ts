import { Either } from 'effect/index';

import { UnknownError } from '../../../../shared/error/errors/UnknownError';
import { UseCase } from '../../../../shared/use-case/UseCase';
import { RentalRequestNotFoundError } from '../../errors/RentalRequestNotFoundError';
import { PaymentGateway } from '../../ports/PaymentGateway';
import { RentalRepository } from '../../ports/RentalRepository';
import { RentalRequestAlreadyPaidError } from './errors/RentalRequestAlreadyPaidError';

interface Props {
  requestId: string;
  renterId: string;
}

type Failure =
  RentalRequestAlreadyPaidError | RentalRequestNotFoundError | UnknownError;

export class AbandonRentalRequest implements UseCase<
  Props,
  Promise<Either.Either<void, Failure>>
> {
  constructor(
    private readonly rentalRepository: RentalRepository,
    private readonly paymentGateway: PaymentGateway,
  ) {}

  public async execute(props: Props): Promise<Either.Either<void, Failure>> {
    try {
      const summary = await this.rentalRepository.findRequestSummary(
        props.requestId,
      );
      if (summary === null || summary.renterId !== props.renterId)
        return Either.left(new RentalRequestNotFoundError());

      if (summary.status !== 'AWAITING_PAYMENT') {
        if (summary.money === 'NONE') return Either.right(undefined);
        return Either.left(new RentalRequestAlreadyPaidError());
      }

      // Fermer la page chez Stripe n'est qu'une précaution : si Stripe ne
      // répond pas, l'abandon a lieu quand même, et une empreinte posée malgré
      // tout sur cette page sera levée à son arrivée.
      if (summary.checkoutSessionId !== null) {
        try {
          await this.paymentGateway.closePaymentPage(summary.checkoutSessionId);
        } catch {
          /* voir ci-dessus */
        }
      }

      await this.rentalRepository.markAbandoned(props.requestId);
      return Either.right(undefined);
    } catch (error: unknown) {
      return Either.left(
        new UnknownError(
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
  }
}
