import { Either } from 'effect/index';

import { UnknownError } from '../../../../shared/error/errors/UnknownError';
import { UseCase } from '../../../../shared/use-case/UseCase';
import { RentalRepository } from '../../ports/RentalRepository';
import {
  PresentedRentalRequest,
  presentRentalRequest,
} from '../../services/presentRentalRequest';

interface Props {
  renterId: string;
  now: Date;
}

export class ListRenterRentalRequests implements UseCase<
  Props,
  Promise<Either.Either<PresentedRentalRequest[], UnknownError>>
> {
  constructor(private readonly rentalRepository: RentalRepository) {}

  public async execute(
    props: Props,
  ): Promise<Either.Either<PresentedRentalRequest[], UnknownError>> {
    try {
      const views = await this.rentalRepository.findAllByRenter(props.renterId);
      return Either.right(
        views.map((view) => presentRentalRequest(view, 'RENTER', props.now)),
      );
    } catch (error: unknown) {
      return Either.left(
        new UnknownError(
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
  }
}
