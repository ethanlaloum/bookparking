import { Either } from 'effect/index';

import { UnknownError } from '../../../../shared/error/errors/UnknownError';
import { UnitOfWork } from '../../../../shared/unit-of-work/UnitOfWork';
import { UseCase } from '../../../../shared/use-case/UseCase';
import { PasswordReset } from '../../entities/PasswordReset';
import { WeakPasswordError } from '../../errors/WeakPasswordError';
import { passwordStrengthOf } from '../../services/passwordStrength';
import { AccountRepository } from '../../ports/AccountRepository';
import { PasswordHasher } from '../../ports/PasswordHasher';
import { PasswordResetRepository } from '../../ports/PasswordResetRepository';
import { InvalidPasswordResetTokenError } from './errors/InvalidPasswordResetTokenError';

interface Props {
  token: string;
  newPassword: string;
  resetAt: Date;
}

type ResetPasswordError =
  InvalidPasswordResetTokenError | WeakPasswordError | UnknownError;

export class ResetPassword implements UseCase<
  Props,
  Promise<Either.Either<void, ResetPasswordError>>
> {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly passwordResetRepository: PasswordResetRepository,
    private readonly unitOfWork: UnitOfWork,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  public async execute(
    props: Props,
  ): Promise<Either.Either<void, ResetPasswordError>> {
    try {
      const reset = await this.passwordResetRepository.findByTokenHash(
        PasswordReset.hashOf(props.token),
      );
      if (reset === null || !reset.isUsableAt(props.resetAt))
        return Either.left(new InvalidPasswordResetTokenError());

      const strength = passwordStrengthOf(props.newPassword);
      if (strength === 'TOO_SHORT' || strength === 'WEAK')
        return Either.left(new WeakPasswordError(strength));

      const passwordHash = this.passwordHasher.hash(props.newPassword);
      const replaced = await this.unitOfWork.process(async (trx) => {
        const spent =
          await this.passwordResetRepository.spendUnspentByAccountId(
            reset.accountId,
            props.resetAt,
            trx,
          );
        if (!spent.includes(reset.tokenHash)) return false;
        await this.accountRepository.replacePasswordHash(
          reset.accountId,
          passwordHash,
          trx,
        );
        return true;
      });
      if (!replaced) return Either.left(new InvalidPasswordResetTokenError());
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
