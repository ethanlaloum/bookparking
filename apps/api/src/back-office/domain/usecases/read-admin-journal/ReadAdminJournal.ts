import { Either } from 'effect/index';

import { UnknownError } from '../../../../shared/error/errors/UnknownError';
import { UseCase } from '../../../../shared/use-case/UseCase';
import { NotABackOfficeAdminError } from '../../errors/NotABackOfficeAdminError';
import {
  AdminJournalEntry,
  BackOfficeRepository,
} from '../../ports/BackOfficeRepository';

interface Props {
  adminAccountId: string;
}

// Assez pour des mois d'exploitation au rythme d'aujourd'hui ; une pagination
// le jour où le journal dépasse ce qu'un écran peut parcourir.
export const JOURNAL_LENGTH = 200;

/**
 * Tout ce que l'administration a fait, de la plus récente action à la plus
 * ancienne : modérations et changements de réglages, avec leur auteur et leur
 * motif.
 */
export class ReadAdminJournal implements UseCase<
  Props,
  Promise<
    Either.Either<AdminJournalEntry[], NotABackOfficeAdminError | UnknownError>
  >
> {
  constructor(private readonly backOfficeRepository: BackOfficeRepository) {}

  public async execute(
    props: Props,
  ): Promise<
    Either.Either<AdminJournalEntry[], NotABackOfficeAdminError | UnknownError>
  > {
    try {
      if (!(await this.backOfficeRepository.isAdmin(props.adminAccountId)))
        return Either.left(new NotABackOfficeAdminError());

      return Either.right(
        await this.backOfficeRepository.findJournal(JOURNAL_LENGTH),
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
