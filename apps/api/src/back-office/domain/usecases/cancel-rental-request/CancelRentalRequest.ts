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
 * Annule une demande de location, confirmée ou non, et rend au conducteur tout
 * son argent : l'empreinte est levée si rien n'a été prélevé, le prélèvement
 * remboursé sinon. L'écriture ne fait que noter la dette ; c'est le balayage
 * du contexte `rental` qui la règle chez Stripe, au plus cinq minutes après.
 *
 * L'ordre des gardes est chargé de sens : administrateur d'abord, motif
 * ensuite, cible en dernier. Vérifier l'existence avant le droit ferait de
 * cette route un oracle : un curieux saurait qu'un identifiant existe sans
 * être administrateur.
 */
export class CancelRentalRequest implements UseCase<
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

      const done = await this.backOfficeRepository.cancelRentalRequest(
        props.targetId,
      );
      if (!done) return Either.left(new ModerationTargetNotFoundError());

      // Le journal est écrit après l'effet, jamais avant : une trace d'une
      // action qui n'a pas eu lieu est pire qu'aucune trace.
      await this.backOfficeRepository.recordAction({
        adminAccountId: props.adminAccountId,
        kind: AdminActionKind.CANCEL_RENTAL_REQUEST,
        targetType: AdminTargetType.RENTAL_REQUEST,
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
