import { Either } from 'effect/index';

import { UnknownError } from '../../../../shared/error/errors/UnknownError';
import { UseCase } from '../../../../shared/use-case/UseCase';
import { Account } from '../../entities/Account';
import { AccountRepository } from '../../ports/AccountRepository';
import { PasswordHasher } from '../../ports/PasswordHasher';

interface Props {
  email: string;
  password: string;
  registeredAt: Date;
}

export class RegisterAccount implements UseCase<
  Props,
  Promise<Either.Either<Account, UnknownError>>
> {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  public async execute(
    props: Props,
  ): Promise<Either.Either<Account, UnknownError>> {
    try {
      const account = Account.register({
        email: props.email,
        passwordHash: this.passwordHasher.hash(props.password),
        registeredAt: props.registeredAt,
      });

      await this.accountRepository.create(account);
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
