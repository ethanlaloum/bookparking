import { Either } from 'effect/index';

import { OutgoingEmail } from '../../../../shared/email-outbox/domain/entities/OutgoingEmail';
import { EmailOutbox } from '../../../../shared/email-outbox/domain/ports/EmailOutbox';
import { UnknownError } from '../../../../shared/error/errors/UnknownError';
import { UnitOfWork } from '../../../../shared/unit-of-work/UnitOfWork';
import { UseCase } from '../../../../shared/use-case/UseCase';
import { Account, Avatar } from '../../entities/Account';
import { WeakPasswordError } from '../../errors/WeakPasswordError';
import { AccountRepository } from '../../ports/AccountRepository';
import { HumanProof, HumanProofSolution } from '../../ports/HumanProof';
import { PasswordHasher } from '../../ports/PasswordHasher';
import { passwordStrengthOf } from '../../services/passwordStrength';
import { EmailAlreadyUsedError } from './errors/EmailAlreadyUsedError';
import { HumanProofRejectedError } from './errors/HumanProofRejectedError';
import { TermsNotAcceptedError } from './errors/TermsNotAcceptedError';

interface Props {
  email: string;
  password: string;
  registeredAt: Date;
  humanProof: HumanProofSolution;
  acceptsTerms: boolean;
  avatar: Avatar;
}

export type RegisterAccountError =
  | EmailAlreadyUsedError
  | WeakPasswordError
  | HumanProofRejectedError
  | TermsNotAcceptedError
  | UnknownError;

export class RegisterAccount implements UseCase<
  Props,
  Promise<Either.Either<Account, RegisterAccountError>>
> {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly emailOutbox: EmailOutbox,
    private readonly unitOfWork: UnitOfWork,
    private readonly humanProof: HumanProof,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  // Le compte et sa bienvenue s'écrivent dans la même transaction (SPEC-006
  // RG-01) : une adresse déjà prise annule les deux, et une file injoignable
  // annule le compte. L'e-mail part plus tard, au balayage — jamais d'ici.
  public async execute(
    props: Props,
  ): Promise<Either.Either<Account, RegisterAccountError>> {
    try {
      // La preuve d'abord, et elle est dépensée quoi qu'il arrive ensuite :
      // une même preuve ne sert pas à sonder plusieurs adresses (SPEC-007 §8).
      if (!(await this.humanProof.accept(props.humanProof, props.registeredAt)))
        return Either.left(new HumanProofRejectedError());

      // SPEC-008 : pas de compte sans la case des conditions d'utilisation.
      if (!props.acceptsTerms) return Either.left(new TermsNotAcceptedError());

      const strength = passwordStrengthOf(props.password);
      if (strength === 'TOO_SHORT' || strength === 'WEAK')
        return Either.left(new WeakPasswordError(strength));

      const account = Account.register({
        email: props.email,
        passwordHash: this.passwordHasher.hash(props.password),
        registeredAt: props.registeredAt,
        termsAcceptedAt: props.registeredAt,
        avatar: props.avatar,
      });

      await this.unitOfWork.process(async (trx) => {
        await this.accountRepository.create(account, trx);
        await this.emailOutbox.enqueue(
          OutgoingEmail.welcome({
            recipient: account.email,
            queuedAt: props.registeredAt,
          }),
          trx,
        );
      });
      return Either.right(account);
    } catch (error: unknown) {
      if (error instanceof EmailAlreadyUsedError) {
        return Either.left(error);
      }
      return Either.left(
        new UnknownError(
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
  }
}
