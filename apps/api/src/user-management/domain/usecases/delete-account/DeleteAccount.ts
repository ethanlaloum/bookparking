import { Either } from 'effect/index';

import { UnknownError } from '../../../../shared/error/errors/UnknownError';
import { UnitOfWork } from '../../../../shared/unit-of-work/UnitOfWork';
import { UseCase } from '../../../../shared/use-case/UseCase';
import { AccountFootprint } from '../../ports/AccountFootprint';
import { AccountRepository } from '../../ports/AccountRepository';
import { PasswordHasher } from '../../ports/PasswordHasher';
import { InvalidCredentialsError } from '../sign-in/errors/InvalidCredentialsError';
import { AccountStillCommittedError } from './errors/AccountStillCommittedError';

interface Props {
  accountId: string;
  password: string;
  at: Date;
}

export type DeleteAccountError =
  InvalidCredentialsError | AccountStillCommittedError | UnknownError;

// Le mot de passe est redemandé : un jeton oublié sur un ordinateur partagé
// ne suffit pas à effacer un compte. Une location en cours, une demande sans
// réponse ou un versement dû retiennent le compte — l'autre partie ou
// l'argent en dépendent encore.
export class DeleteAccount implements UseCase<
  Props,
  Promise<Either.Either<void, DeleteAccountError>>
> {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly accountFootprint: AccountFootprint,
    private readonly passwordHasher: PasswordHasher,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  public async execute(
    props: Props,
  ): Promise<Either.Either<void, DeleteAccountError>> {
    try {
      const account = await this.accountRepository.findById(props.accountId);
      if (account === null) return Either.left(new InvalidCredentialsError());

      if (!this.passwordHasher.verify(props.password, account.passwordHash))
        return Either.left(new InvalidCredentialsError());

      return await this.unitOfWork.process(async (trx) => {
        if (
          await this.accountFootprint.hasOngoingCommitments(
            account.id,
            props.at,
            trx,
          )
        )
          return Either.left(new AccountStillCommittedError());

        await this.accountFootprint.erase(account.id, account.email, trx);
        await this.accountRepository.delete(account.id, trx);
        return Either.right(undefined);
      });
    } catch (error: unknown) {
      return Either.left(
        new UnknownError(
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
  }
}
