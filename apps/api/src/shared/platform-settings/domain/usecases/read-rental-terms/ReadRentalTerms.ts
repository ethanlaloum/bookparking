import { Either } from 'effect/index';

import { UnknownError } from '../../../../error/errors/UnknownError';
import { UseCase } from '../../../../use-case/UseCase';
import { PlatformSettings } from '../../entities/PlatformSettings';
import { PlatformSettingsReader } from '../../ports/PlatformSettingsReader';

/**
 * Les conditions qu'une demande faite maintenant figerait. Le site les lit
 * pour ne rien promettre d'autre que ce que l'api appliquera : la FAQ, les
 * conditions d'utilisation et « Versements » citaient leurs chiffres en dur.
 */
export class ReadRentalTerms implements UseCase<
  void,
  Promise<Either.Either<PlatformSettings, UnknownError>>
> {
  constructor(
    private readonly platformSettingsReader: PlatformSettingsReader,
  ) {}

  public async execute(): Promise<
    Either.Either<PlatformSettings, UnknownError>
  > {
    try {
      return Either.right(await this.platformSettingsReader.current());
    } catch (error: unknown) {
      return Either.left(
        new UnknownError(
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
  }
}
