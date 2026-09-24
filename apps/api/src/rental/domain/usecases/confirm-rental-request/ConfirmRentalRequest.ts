import { Either } from 'effect/index';

import { UnknownError } from '../../../../shared/error/errors/UnknownError';
import { UseCase } from '../../../../shared/use-case/UseCase';
import {
  hasReachedTheOwner,
  idempotencyKeyOf,
} from '../../entities/RentalMoney';
import { PaymentUnavailableError } from '../../errors/PaymentUnavailableError';
import { PaymentGateway } from '../../ports/PaymentGateway';
import { RentalRepository } from '../../ports/RentalRepository';
import { RentalRequestExpiredError } from './errors/RentalRequestExpiredError';
import { RentalRequestPaymentFailedError } from './errors/RentalRequestPaymentFailedError';
import { RentalRequestNotFoundError } from '../../errors/RentalRequestNotFoundError';

interface Props {
  requestId: string;
  ownerId: string;
  confirmedAt: Date;
}

export class ConfirmRentalRequest implements UseCase<
  Props,
  Promise<
    Either.Either<
      void,
      | PaymentUnavailableError
      | RentalRequestExpiredError
      | RentalRequestNotFoundError
      | RentalRequestPaymentFailedError
      | UnknownError
    >
  >
> {
  constructor(
    private readonly rentalRepository: RentalRepository,
    private readonly paymentGateway: PaymentGateway,
  ) {}

  public async execute(
    props: Props,
  ): Promise<
    Either.Either<
      void,
      | PaymentUnavailableError
      | RentalRequestExpiredError
      | RentalRequestNotFoundError
      | RentalRequestPaymentFailedError
      | UnknownError
    >
  > {
    try {
      const summary = await this.rentalRepository.findRequestSummary(
        props.requestId,
      );

      // Une demande que ce compte ne possède pas se refuse exactement comme une
      // demande inexistante : sans quoi la réponse dirait à n'importe qui
      // qu'une demande porte cet identifiant, et sur quelle place.
      if (summary === null || summary.ownerId !== props.ownerId)
        return Either.left(new RentalRequestNotFoundError());

      // Une demande qui n'a jamais atteint le loueur se refuse comme une
      // demande inconnue : il ne l'a pas vue, et rien n'y est à prélever.
      if (!hasReachedTheOwner(summary.status))
        return Either.left(new RentalRequestNotFoundError());

      // Confirmer deux fois ne produit ni erreur ni seconde écriture : le
      // loueur qui rejoue sa requête obtient le même état, comme une seconde
      // dépublication d'annonce.
      if (summary.isConfirmed) return Either.right(undefined);

      // Une demande expirée se refuse en le disant : le loueur la possède, rien
      // ne se divulgue en lui apprenant qu'elle a existé et qu'il a trop tardé.
      if (summary.isExpired)
        return Either.left(new RentalRequestExpiredError());

      if (summary.status === 'PAYMENT_FAILED')
        return Either.left(new RentalRequestPaymentFailedError());

      // Le prélèvement précède l'écriture : confirmer sans avoir été payé
      // donnerait au loueur une réservation qu'aucun argent ne garantit. Si
      // l'écriture échoue ensuite, le loueur rejoue sa confirmation et la clé
      // d'idempotence rend le même prélèvement ; à défaut, le balayage relit
      // ce prélèvement comme une confirmation.
      if (summary.money === 'AUTHORIZED' && summary.paymentId !== null) {
        let outcome: 'CAPTURED' | 'DECLINED';
        try {
          outcome = await this.paymentGateway.capture(
            summary.paymentId,
            idempotencyKeyOf(summary.id, 'capture'),
          );
        } catch (error: unknown) {
          if (error instanceof PaymentUnavailableError)
            return Either.left(error);
          throw error;
        }
        if (outcome === 'DECLINED') {
          await this.rentalRepository.markPaymentFailed(summary.id);
          return Either.left(new RentalRequestPaymentFailedError());
        }
      }

      await this.rentalRepository.confirmRequest(
        props.requestId,
        props.confirmedAt,
      );
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
