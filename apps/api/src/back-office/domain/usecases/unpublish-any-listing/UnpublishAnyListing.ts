import { Either } from 'effect/index';

import { UnknownError } from '../../../../shared/error/errors/UnknownError';
import { UseCase } from '../../../../shared/use-case/UseCase';
import {
  AdminActionKind,
  AdminTargetType,
  isUsableReason,
} from '../../entities/AdminAction';
import { MissingModerationReasonError } from '../../errors/MissingModerationReasonError';
import { ModerationTargetNotFoundError } from '../../errors/ModerationTargetNotFoundError';
import { NotABackOfficeAdminError } from '../../errors/NotABackOfficeAdminError';
import { BackOfficeRepository } from '../../ports/BackOfficeRepository';

interface Props {
  adminAccountId: string;
  targetId: string;
  reason: string;
  actedAt: Date;
}

/**
 * Dépublie l'annonce de n'importe qui. Le propriétaire n'en est pas averti
 * par le produit aujourd'hui : il le découvrira sur son tableau de bord, où
 * l'annonce apparaîtra dépubliée.
 *
 * L'ordre des gardes est chargé de sens : administrateur d'abord, motif
 * ensuite, cible en dernier. Vérifier l'existence avant le droit ferait de
 * cette route un oracle : un curieux saurait qu'un identifiant existe sans
 * être administrateur.
 */
export class UnpublishAnyListing implements UseCase<
  Props,
  Promise<
    Either.Either<
      void,
      | NotABackOfficeAdminError
      | MissingModerationReasonError
      | ModerationTargetNotFoundError
      | UnknownError
    >
  >
> {
  constructor(private readonly backOfficeRepository: BackOfficeRepository) {}

  public async execute(
    props: Props,
  ): Promise<
    Either.Either<
      void,
      | NotABackOfficeAdminError
      | MissingModerationReasonError
      | ModerationTargetNotFoundError
      | UnknownError
    >
  > {
    try {
      if (!(await this.backOfficeRepository.isAdmin(props.adminAccountId)))
        return Either.left(new NotABackOfficeAdminError());

      if (!isUsableReason(props.reason))
        return Either.left(new MissingModerationReasonError());

      const done = await this.backOfficeRepository.unpublishListing(
        props.targetId,
      );
      if (!done) return Either.left(new ModerationTargetNotFoundError());

      // Le journal est écrit après l'effet, jamais avant : une trace d'une
      // action qui n'a pas eu lieu est pire qu'aucune trace.
      await this.backOfficeRepository.recordAction({
        adminAccountId: props.adminAccountId,
        kind: AdminActionKind.UNPUBLISH_LISTING,
        targetType: AdminTargetType.LISTING,
        targetId: props.targetId,
        reason: props.reason.trim(),
        actedAt: props.actedAt,
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
