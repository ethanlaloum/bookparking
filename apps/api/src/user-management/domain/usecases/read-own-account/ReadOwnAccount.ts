import { Either } from 'effect/index';

import { UnknownError } from '../../../../shared/error/errors/UnknownError';
import { UseCase } from '../../../../shared/use-case/UseCase';
import { Account } from '../../entities/Account';
import { AccountRepository } from '../../ports/AccountRepository';
import { AccountNotFoundError } from '../../errors/AccountNotFoundError';

interface Props {
  accountId: string;
}

export type ReadOwnAccountError = AccountNotFoundError | UnknownError;

// Le compte lu est toujours celui du jeton : la route ne prend aucun
// identifiant, si bien qu'on ne peut lire que le sien.
export class ReadOwnAccount implements UseCase<
  Props,
  Promise<Either.Either<Account, ReadOwnAccountError>>
> {
  constructor(private readonly accountRepository: AccountRepository) {}

  public async execute(
    props: Props,
  ): Promise<Either.Either<Account, ReadOwnAccountError>> {
    try {
      const account = await this.accountRepository.findById(props.accountId);
      if (account === null) return Either.left(new AccountNotFoundError());
      return Either.right(account);
    } catch (error: unknown) {
      return Either.left(
        new UnknownError(
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
  }
}
