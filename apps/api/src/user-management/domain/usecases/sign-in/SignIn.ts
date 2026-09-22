import { Either } from 'effect/index';

import { UnknownError } from '../../../../shared/error/errors/UnknownError';
import { UseCase } from '../../../../shared/use-case/UseCase';
import { issueAccessToken } from '../../services/issueAccessToken';
import { AccountRepository } from '../../ports/AccountRepository';
import { PasswordHasher } from '../../ports/PasswordHasher';
import { InvalidCredentialsError } from './errors/InvalidCredentialsError';

interface Props {
  email: string;
  password: string;
  at: Date;
}

interface SignInResult {
  token: string;
  validUntil: Date;
}

export class SignIn implements UseCase<
  Props,
  Promise<Either.Either<SignInResult, InvalidCredentialsError | UnknownError>>
> {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  public async execute(
    props: Props,
  ): Promise<
    Either.Either<SignInResult, InvalidCredentialsError | UnknownError>
  > {
    try {
      const account = await this.accountRepository.findByEmail(props.email);
      if (account === null) return Either.left(new InvalidCredentialsError());

      if (!this.passwordHasher.verify(props.password, account.passwordHash))
        return Either.left(new InvalidCredentialsError());

      return Either.right(issueAccessToken(account.id, props.at));
    } catch (error: unknown) {
      return Either.left(
        new UnknownError(
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
  }
}
