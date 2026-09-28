import { randomBytes } from 'node:crypto';

import { Either } from 'effect/index';

import { OutgoingEmail } from '../../../../shared/email-outbox/domain/entities/OutgoingEmail';
import { EmailOutbox } from '../../../../shared/email-outbox/domain/ports/EmailOutbox';
import { UnknownError } from '../../../../shared/error/errors/UnknownError';
import { UnitOfWork } from '../../../../shared/unit-of-work/UnitOfWork';
import { UseCase } from '../../../../shared/use-case/UseCase';
import { PasswordReset } from '../../entities/PasswordReset';
import { AccountRepository } from '../../ports/AccountRepository';
import { PasswordResetRepository } from '../../ports/PasswordResetRepository';

interface Props {
  email: string;
  requestedAt: Date;
}

export class RequestPasswordReset implements UseCase<
  Props,
  Promise<Either.Either<void, UnknownError>>
> {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly passwordResetRepository: PasswordResetRepository,
    private readonly emailOutbox: EmailOutbox,
    private readonly unitOfWork: UnitOfWork,
    private readonly drawToken: () => string = () =>
      randomBytes(32).toString('base64url'),
  ) {}

  public async execute(
    props: Props,
  ): Promise<Either.Either<void, UnknownError>> {
    try {
      const account = await this.accountRepository.findByEmail(props.email);
      if (account === null || account.isSuspended())
        return Either.right(undefined);

      const latest = await this.passwordResetRepository.findLatestByAccountId(
        account.id,
      );
      if (latest !== null && !latest.allowsAnotherRequestAt(props.requestedAt))
        return Either.right(undefined);

      const token = this.drawToken();
      await this.unitOfWork.process(async (trx) => {
        await this.passwordResetRepository.create(
          PasswordReset.issue({
            accountId: account.id,
            token,
            requestedAt: props.requestedAt,
          }),
          trx,
        );
        await this.emailOutbox.enqueue(
          OutgoingEmail.passwordReset({
            recipient: account.email,
            token,
            queuedAt: props.requestedAt,
          }),
          trx,
        );
      });
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
