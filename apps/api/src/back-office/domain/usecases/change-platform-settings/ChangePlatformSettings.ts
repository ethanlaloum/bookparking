import { Either } from 'effect/index';

import { UnknownError } from '../../../../shared/error/errors/UnknownError';
import {
  checkPlatformSettings,
  PLATFORM_SETTINGS_BOUNDS,
  PlatformSetting,
  PlatformSettings,
} from '../../../../shared/platform-settings/domain/entities/PlatformSettings';
import { InvalidPlatformSettingsError } from '../../../../shared/platform-settings/domain/errors/InvalidPlatformSettingsError';
import { PlatformSettingsReader } from '../../../../shared/platform-settings/domain/ports/PlatformSettingsReader';
import { UnitOfWork } from '../../../../shared/unit-of-work/UnitOfWork';
import { UseCase } from '../../../../shared/use-case/UseCase';
import {
  AdminActionKind,
  AdminTargetType,
  isUsableReason,
} from '../../entities/AdminAction';
import { MissingModerationReasonError } from '../../errors/MissingModerationReasonError';
import { NotABackOfficeAdminError } from '../../errors/NotABackOfficeAdminError';
import { PlatformSettingsUnchangedError } from '../../errors/PlatformSettingsUnchangedError';
import { BackOfficeRepository } from '../../ports/BackOfficeRepository';

interface Props {
  adminAccountId: string;
  settings: PlatformSettings;
  reason: string;
  actedAt: Date;
}

type Failure =
  | NotABackOfficeAdminError
  | MissingModerationReasonError
  | InvalidPlatformSettingsError
  | PlatformSettingsUnchangedError
  | UnknownError;

const isSameAs = (a: PlatformSettings, b: PlatformSettings): boolean =>
  (Object.keys(PLATFORM_SETTINGS_BOUNDS) as PlatformSetting[]).every(
    (setting) => a[setting] === b[setting],
  );

/**
 * Change les conditions de location. La nouvelle version vaut pour les
 * demandes faites à partir de maintenant : chaque demande déjà faite garde les
 * valeurs figées sur elle, et personne n'est surpris en cours de route.
 *
 * Même ordre de gardes que la modération — administrateur, motif, puis la
 * valeur elle-même — et même journal : la version et sa ligne de journal
 * s'écrivent dans une seule transaction, pour qu'aucun réglage ne change sans
 * qu'on sache qui l'a changé, et pourquoi.
 */
export class ChangePlatformSettings implements UseCase<
  Props,
  Promise<Either.Either<void, Failure>>
> {
  constructor(
    private readonly backOfficeRepository: BackOfficeRepository,
    private readonly platformSettingsReader: PlatformSettingsReader,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  public async execute(props: Props): Promise<Either.Either<void, Failure>> {
    try {
      if (!(await this.backOfficeRepository.isAdmin(props.adminAccountId)))
        return Either.left(new NotABackOfficeAdminError());

      if (!isUsableReason(props.reason))
        return Either.left(new MissingModerationReasonError());

      const checked = checkPlatformSettings(props.settings);
      if (Either.isLeft(checked)) return Either.left(checked.left);

      if (isSameAs(checked.right, await this.platformSettingsReader.current()))
        return Either.left(new PlatformSettingsUnchangedError());

      const reason = props.reason.trim();
      await this.unitOfWork.process(async (trx) => {
        const versionId = await this.backOfficeRepository.savePlatformSettings(
          checked.right,
          { adminAccountId: props.adminAccountId, reason, at: props.actedAt },
          trx,
        );
        await this.backOfficeRepository.recordAction(
          {
            adminAccountId: props.adminAccountId,
            kind: AdminActionKind.CHANGE_PLATFORM_SETTINGS,
            targetType: AdminTargetType.PLATFORM_SETTINGS,
            targetId: versionId,
            reason,
            actedAt: props.actedAt,
          },
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
