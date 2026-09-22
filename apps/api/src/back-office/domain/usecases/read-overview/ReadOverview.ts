import { Either } from 'effect/index';

import { UnknownError } from '../../../../shared/error/errors/UnknownError';
import { UseCase } from '../../../../shared/use-case/UseCase';
import { NotABackOfficeAdminError } from '../../errors/NotABackOfficeAdminError';
import {
  BackOfficeRepository,
  OverviewActivity,
  OverviewAttention,
  OverviewCounts,
} from '../../ports/BackOfficeRepository';

interface Props {
  adminAccountId: string;
  now: Date;
}

export interface Overview {
  counts: OverviewCounts;
  activity: OverviewActivity;
  attention: OverviewAttention;
}

export class ReadOverview implements UseCase<
  Props,
  Promise<Either.Either<Overview, NotABackOfficeAdminError | UnknownError>>
> {
  constructor(private readonly backOfficeRepository: BackOfficeRepository) {}

  public async execute(
    props: Props,
  ): Promise<Either.Either<Overview, NotABackOfficeAdminError | UnknownError>> {
    try {
      // Le garde HTTP a déjà tranché, mais le cas d'usage ne s'y fie pas : un
      // appelant qui n'est pas administrateur ne doit rien lire, quel que soit
      // le chemin par lequel il arrive.
      if (!(await this.backOfficeRepository.isAdmin(props.adminAccountId)))
        return Either.left(new NotABackOfficeAdminError());

      const [counts, activity, attention] = await Promise.all([
        this.backOfficeRepository.countsOverview(),
        this.backOfficeRepository.activityOverview(props.now),
        this.backOfficeRepository.attentionOverview(props.now),
      ]);

      return Either.right({ counts, activity, attention });
    } catch (error: unknown) {
      return Either.left(
        new UnknownError(
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
  }
}
