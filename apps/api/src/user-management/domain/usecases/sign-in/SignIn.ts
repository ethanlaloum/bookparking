import { randomBytes } from 'node:crypto';

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

const DECOY_SECRET_BYTE_LENGTH = 32;

export class SignIn implements UseCase<
  Props,
  Promise<Either.Either<SignInResult, InvalidCredentialsError | UnknownError>>
> {
  private readonly unknownAccountDecoyHash: string;

  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly accessTokenSecret: string,
  ) {
    this.unknownAccountDecoyHash = this.passwordHasher.hash(
      randomBytes(DECOY_SECRET_BYTE_LENGTH).toString('hex'),
    );
  }

  public async execute(
    props: Props,
  ): Promise<
    Either.Either<SignInResult, InvalidCredentialsError | UnknownError>
  > {
    try {
      const account = await this.accountRepository.findByEmail(props.email);
      if (account === null) {
        this.passwordHasher.verify(
          props.password,
          this.unknownAccountDecoyHash,
        );
        return Either.left(new InvalidCredentialsError());
      }

      if (!this.passwordHasher.verify(props.password, account.passwordHash))
        return Either.left(new InvalidCredentialsError());

      return Either.right(
        issueAccessToken(account.id, props.at, this.accessTokenSecret),
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
