import { Either } from 'effect/index';

import { UnknownError } from '../../../../shared/error/errors/UnknownError';
import { UseCase } from '../../../../shared/use-case/UseCase';
import { AccountRepository } from '../../ports/AccountRepository';
import { PasswordHasher } from '../../ports/PasswordHasher';
import { InvalidCredentialsError } from '../sign-in/errors/InvalidCredentialsError';
import { WeakPasswordError } from './errors/WeakPasswordError';

const MINIMUM_PASSWORD_LENGTH = 8;

interface Props {
  accountId: string;
  currentPassword: string;
  newPassword: string;
}

type ChangePasswordError =
  InvalidCredentialsError | WeakPasswordError | UnknownError;

export class ChangePassword implements UseCase<
  Props,
  Promise<Either.Either<void, ChangePasswordError>>
> {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  public async execute(
    props: Props,
  ): Promise<Either.Either<void, ChangePasswordError>> {
    try {
      const account = await this.accountRepository.findById(props.accountId);
      if (account === null) return Either.left(new InvalidCredentialsError());

      if (
        !this.passwordHasher.verify(props.currentPassword, account.passwordHash)
      )
        return Either.left(new InvalidCredentialsError());

      if (props.newPassword.length < MINIMUM_PASSWORD_LENGTH)
        return Either.left(new WeakPasswordError());

      await this.accountRepository.replacePasswordHash(
        account.id,
        this.passwordHasher.hash(props.newPassword),
      );
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
