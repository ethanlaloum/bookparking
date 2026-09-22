import { Either } from 'effect/index';

import { UnknownError } from '../../../../shared/error/errors/UnknownError';
import { UseCase } from '../../../../shared/use-case/UseCase';
import {
  RentalRepository,
  RentalRequestView,
} from '../../ports/RentalRepository';

interface Props {
  renterId: string;
}

export class ListRenterRentalRequests implements UseCase<
  Props,
  Promise<Either.Either<RentalRequestView[], UnknownError>>
> {
  constructor(private readonly rentalRepository: RentalRepository) {}

  public async execute(
    props: Props,
  ): Promise<Either.Either<RentalRequestView[], UnknownError>> {
    try {
      return Either.right(
        await this.rentalRepository.findAllByRenter(props.renterId),
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
