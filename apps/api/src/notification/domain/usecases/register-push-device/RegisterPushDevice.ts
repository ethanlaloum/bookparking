import { Either } from 'effect/index';

import { UnknownError } from '../../../../shared/error/errors/UnknownError';
import { UseCase } from '../../../../shared/use-case/UseCase';
import { PushDeviceRepository } from '../../ports/PushDeviceRepository';

interface Props {
  accountId: string;
  token: string;
  registeredAt: Date;
}

// L'app enregistre son jeton à chaque ouverture de session : idempotent par
// l'état, un jeton déjà connu change seulement de compte s'il le faut.
export class RegisterPushDevice implements UseCase<
  Props,
  Promise<Either.Either<void, UnknownError>>
> {
  constructor(private readonly pushDevices: PushDeviceRepository) {}

  public async execute(
    props: Props,
  ): Promise<Either.Either<void, UnknownError>> {
    try {
      await this.pushDevices.register(
        props.token,
        props.accountId,
        props.registeredAt,
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
