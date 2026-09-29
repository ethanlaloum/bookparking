import { Either } from 'effect/index';

import { UnknownError } from '../../../../shared/error/errors/UnknownError';
import { UseCase } from '../../../../shared/use-case/UseCase';
import { hasReachedTheOwner } from '../../entities/RentalMoney';
import { RentalRepository } from '../../ports/RentalRepository';
import {
  PresentedRentalRequest,
  presentRentalRequest,
} from '../../services/presentRentalRequest';

interface Props {
  ownerId: string;
}

export class ListOwnerRentalRequests implements UseCase<
  Props,
  Promise<Either.Either<PresentedRentalRequest[], UnknownError>>
> {
  constructor(private readonly rentalRepository: RentalRepository) {}

  public async execute(
    props: Props,
  ): Promise<Either.Either<PresentedRentalRequest[], UnknownError>> {
    try {
      const views = await this.rentalRepository.findAllForOwner(props.ownerId);
      const now = new Date();
      return Either.right(
        views
          .filter((view) => hasReachedTheOwner(view.status))
          .map((view) => presentRentalRequest(view, 'OWNER', now)),
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
