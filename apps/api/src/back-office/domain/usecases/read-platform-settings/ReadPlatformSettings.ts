import { Either } from 'effect/index';

import { UnknownError } from '../../../../shared/error/errors/UnknownError';
import {
  PLATFORM_SETTINGS_BOUNDS,
  PlatformSettings,
} from '../../../../shared/platform-settings/domain/entities/PlatformSettings';
import { PlatformSettingsReader } from '../../../../shared/platform-settings/domain/ports/PlatformSettingsReader';
import { UseCase } from '../../../../shared/use-case/UseCase';
import { NotABackOfficeAdminError } from '../../errors/NotABackOfficeAdminError';
import { BackOfficeRepository } from '../../ports/BackOfficeRepository';

interface Props {
  adminAccountId: string;
}

export interface PlatformSettingsForm {
  settings: PlatformSettings;
  // Les bornes viennent d'ici, pas de l'écran : le formulaire refuse ce que
  // l'api refuserait, sans en recopier les chiffres.
  bounds: typeof PLATFORM_SETTINGS_BOUNDS;
}

export class ReadPlatformSettings implements UseCase<
  Props,
  Promise<
    Either.Either<PlatformSettingsForm, NotABackOfficeAdminError | UnknownError>
  >
> {
  constructor(
    private readonly backOfficeRepository: BackOfficeRepository,
    private readonly platformSettingsReader: PlatformSettingsReader,
  ) {}

  public async execute(
    props: Props,
  ): Promise<
    Either.Either<PlatformSettingsForm, NotABackOfficeAdminError | UnknownError>
  > {
    try {
      if (!(await this.backOfficeRepository.isAdmin(props.adminAccountId)))
        return Either.left(new NotABackOfficeAdminError());

      return Either.right({
        settings: await this.platformSettingsReader.current(),
        bounds: PLATFORM_SETTINGS_BOUNDS,
      });
    } catch (error: unknown) {
      return Either.left(
        new UnknownError(
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
  }
}
