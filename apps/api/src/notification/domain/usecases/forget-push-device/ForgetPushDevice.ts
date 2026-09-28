import { Either } from 'effect/index';

import { UnknownError } from '../../../../shared/error/errors/UnknownError';
import { UseCase } from '../../../../shared/use-case/UseCase';
import { PushDeviceRepository } from '../../ports/PushDeviceRepository';

interface Props {
  token: string;
}

// À la déconnexion, le téléphone cesse de recevoir les notifications du compte
// qui s'en va. Le jeton suffit : qui le connaît peut déjà pousser vers ce
// téléphone par Expo, l'oublier ne lui donne rien de plus.
export class ForgetPushDevice implements UseCase<
  Props,
  Promise<Either.Either<void, UnknownError>>
> {
  constructor(private readonly pushDevices: PushDeviceRepository) {}

  public async execute(
    props: Props,
  ): Promise<Either.Either<void, UnknownError>> {
    try {
      await this.pushDevices.forget([props.token]);
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
