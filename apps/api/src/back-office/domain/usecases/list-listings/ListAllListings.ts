import { Either } from 'effect/index';

import { UnknownError } from '../../../../shared/error/errors/UnknownError';
import { UseCase } from '../../../../shared/use-case/UseCase';
import { NotABackOfficeAdminError } from '../../errors/NotABackOfficeAdminError';
import {
  BackOfficeRepository,
  AdminListingView,
} from '../../ports/BackOfficeRepository';

interface Props {
  adminAccountId: string;
}

export class ListAllListings implements UseCase<
  Props,
  Promise<
    Either.Either<AdminListingView[], NotABackOfficeAdminError | UnknownError>
  >
> {
  constructor(private readonly backOfficeRepository: BackOfficeRepository) {}

  public async execute(
    props: Props,
  ): Promise<
    Either.Either<AdminListingView[], NotABackOfficeAdminError | UnknownError>
  > {
    try {
      if (!(await this.backOfficeRepository.isAdmin(props.adminAccountId)))
        return Either.left(new NotABackOfficeAdminError());

      return Either.right(await this.backOfficeRepository.findAllListings());
    } catch (error: unknown) {
      return Either.left(
        new UnknownError(
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
  }
}
