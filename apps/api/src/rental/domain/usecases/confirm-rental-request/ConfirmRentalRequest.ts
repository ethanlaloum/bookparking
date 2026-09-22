import { Either } from 'effect/index';

import { UnknownError } from '../../../../shared/error/errors/UnknownError';
import { UseCase } from '../../../../shared/use-case/UseCase';
import { RentalRepository } from '../../ports/RentalRepository';
import { RentalRequestExpiredError } from './errors/RentalRequestExpiredError';
import { RentalRequestNotFoundError } from './errors/RentalRequestNotFoundError';

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
      RentalRequestExpiredError | RentalRequestNotFoundError | UnknownError
    >
  >
> {
  constructor(private readonly rentalRepository: RentalRepository) {}

  public async execute(
    props: Props,
  ): Promise<
    Either.Either<
      void,
      RentalRequestExpiredError | RentalRequestNotFoundError | UnknownError
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

      // Confirmer deux fois ne produit ni erreur ni seconde écriture : le
      // loueur qui rejoue sa requête obtient le même état, comme une seconde
      // dépublication d'annonce.
      if (summary.isConfirmed) return Either.right(undefined);

      // Une demande expirée se refuse en le disant : le loueur la possède, rien
      // ne se divulgue en lui apprenant qu'elle a existé et qu'il a trop tardé.
      if (summary.isExpired)
        return Either.left(new RentalRequestExpiredError());

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
