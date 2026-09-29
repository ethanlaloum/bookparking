import { Either } from 'effect/index';

import { UnknownError } from '../../../../shared/error/errors/UnknownError';
import { UseCase } from '../../../../shared/use-case/UseCase';
import { RentalRequestNotFoundError } from '../../errors/RentalRequestNotFoundError';
import { RentalIssueRepository } from '../../ports/RentalIssueRepository';
import { RentalRepository } from '../../ports/RentalRepository';
import { ArrivalBlockedByIssueError } from './errors/ArrivalBlockedByIssueError';
import { ArrivalNotYetPossibleError } from './errors/ArrivalNotYetPossibleError';

interface Props {
  requestId: string;
  renterId: string;
  arrivedAt: Date;
}

type Failure =
  | ArrivalBlockedByIssueError
  | ArrivalNotYetPossibleError
  | RentalRequestNotFoundError
  | UnknownError;

/**
 * Le conducteur dit qu'il est arrivé : c'est le premier des deux événements
 * qui libèrent l'argent vers le loueur (D-22), l'autre étant un délai après le
 * début de la location. Seul le conducteur d'une réservation confirmée le
 * peut, et pas avant son premier jour. Idempotent par l'état : une seconde
 * arrivée ne réécrit rien.
 */
export class ConfirmArrival implements UseCase<
  Props,
  Promise<Either.Either<void, Failure>>
> {
  constructor(
    private readonly rentalRepository: RentalRepository,
    private readonly rentalIssueRepository: RentalIssueRepository,
  ) {}

  public async execute(props: Props): Promise<Either.Either<void, Failure>> {
    try {
      const summary = await this.rentalRepository.findRequestSummary(
        props.requestId,
      );
      if (summary === null || summary.renterId !== props.renterId)
        return Either.left(new RentalRequestNotFoundError());

      if (
        summary.status !== 'CONFIRMED' ||
        props.arrivedAt.getTime() < summary.startsAt.getTime()
      )
        return Either.left(new ArrivalNotYetPossibleError());

      // Confirmer son arrivée libère l'argent du loueur : impossible tant
      // qu'une réclamation, qui le gèle, attend la décision de Bookparking.
      const context = await this.rentalIssueRepository.findContext(summary.id);
      if (context?.issue?.status === 'OPEN')
        return Either.left(new ArrivalBlockedByIssueError());

      await this.rentalRepository.markArrived(summary.id, props.arrivedAt);
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
