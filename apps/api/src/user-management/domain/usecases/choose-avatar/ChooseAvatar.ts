import { Either } from 'effect/index';

import { UnknownError } from '../../../../shared/error/errors/UnknownError';
import { UseCase } from '../../../../shared/use-case/UseCase';
import { Avatar } from '../../entities/Account';
import { AccountNotFoundError } from '../../errors/AccountNotFoundError';
import { AccountRepository } from '../../ports/AccountRepository';

interface Props {
  accountId: string;
  avatar: Avatar;
}

export type ChooseAvatarError = AccountNotFoundError | UnknownError;

// Le compte est toujours celui du jeton : on ne change que son propre avatar.
export class ChooseAvatar implements UseCase<
  Props,
  Promise<Either.Either<void, ChooseAvatarError>>
> {
  constructor(private readonly accountRepository: AccountRepository) {}

  public async execute(
    props: Props,
  ): Promise<Either.Either<void, ChooseAvatarError>> {
    try {
      const account = await this.accountRepository.findById(props.accountId);
      if (account === null) return Either.left(new AccountNotFoundError());
      await this.accountRepository.replaceAvatar(account.id, props.avatar);
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
