import { Either } from 'effect/index';

import { UnknownError } from '../../../../shared/error/errors/UnknownError';
import { UseCase } from '../../../../shared/use-case/UseCase';
import { hasReachedTheOwner } from '../../entities/RentalMoney';
import {
  RentalRepository,
  RentalRequestView,
} from '../../ports/RentalRepository';

interface Props {
  ownerId: string;
}

export class ListOwnerRentalRequests implements UseCase<
  Props,
  Promise<Either.Either<RentalRequestView[], UnknownError>>
> {
  constructor(private readonly rentalRepository: RentalRepository) {}

  public async execute(
    props: Props,
  ): Promise<Either.Either<RentalRequestView[], UnknownError>> {
    try {
      const views = await this.rentalRepository.findAllForOwner(props.ownerId);
      return Either.right(
        views.filter((view) => hasReachedTheOwner(view.status)),
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
