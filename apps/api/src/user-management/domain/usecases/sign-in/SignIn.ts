import { randomBytes } from 'node:crypto';

import { Either } from 'effect/index';

import { UnknownError } from '../../../../shared/error/errors/UnknownError';
import { UseCase } from '../../../../shared/use-case/UseCase';
import { Account } from '../../entities/Account';
import { issueAccessToken } from '../../services/issueAccessToken';
import { signInDelayInMilliseconds } from '../../services/signInThrottle';
import { AccountRepository } from '../../ports/AccountRepository';
import { Delay } from '../../ports/Delay';
import { PasswordHasher } from '../../ports/PasswordHasher';
import { SignInFailureLog } from '../../ports/SignInFailureLog';
import { InvalidCredentialsError } from './errors/InvalidCredentialsError';

interface Props {
  email: string;
  password: string;
  originKey: string;
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
    private readonly failureLog: SignInFailureLog,
    private readonly delay: Delay,
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
    const attempt = {
      accountKey: Account.normalizeEmail(props.email),
      originKey: props.originKey,
      at: props.at,
    };

    try {
      // Le ralentissement précède toute authentification : il ne dépend
      // d'aucun droit, et retarde de la même façon une adresse inconnue et un
      // mot de passe faux, pour que le délai ne distingue pas les deux refus.
      await this.delay.wait(
        signInDelayInMilliseconds(this.failureLog.recent(), attempt),
      );

      const account = await this.accountRepository.findByEmail(props.email);
      if (account === null) {
        this.passwordHasher.verify(
          props.password,
          this.unknownAccountDecoyHash,
        );
        this.failureLog.record(attempt);
        return Either.left(new InvalidCredentialsError());
      }

      if (!this.passwordHasher.verify(props.password, account.passwordHash)) {
        this.failureLog.record(attempt);
        return Either.left(new InvalidCredentialsError());
      }

      // Un compte suspendu se refuse *après* la vérification du mot de passe, et
      // avec le même refus : répondre plus tôt, ou différemment, apprendrait à
      // un inconnu qu'une adresse existe et qu'elle est sanctionnée.
      if (account.isSuspended()) {
        this.failureLog.record(attempt);
        return Either.left(new InvalidCredentialsError());
      }

      this.failureLog.forget(attempt.accountKey);
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
