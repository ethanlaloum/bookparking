import { Either } from 'effect/index';

import { UnknownError } from '../../../../shared/error/errors/UnknownError';
import { passwordStrengthOf } from '../../services/passwordStrength';
import { UseCase } from '../../../../shared/use-case/UseCase';
import { AccountRepository } from '../../ports/AccountRepository';
import { PasswordHasher } from '../../ports/PasswordHasher';
import { InvalidCredentialsError } from '../sign-in/errors/InvalidCredentialsError';
import { WeakPasswordError } from '../../errors/WeakPasswordError';

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

      const strength = passwordStrengthOf(props.newPassword);
      if (strength === 'TOO_SHORT' || strength === 'WEAK')
        return Either.left(new WeakPasswordError(strength));

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
