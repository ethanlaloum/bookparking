import { PresentedRentalRequest } from '../../domain/services/presentRentalRequest';
import { GetRentalRequestResponseDto } from '../rest/dtos/GetRentalRequestResponseDto';

// `renterId` et `ownerId` ne traversent pas : les deux routes sont déjà clés
// sur le compte qui appelle, donc les rendre n'apprendrait rien à son
// destinataire légitime et désignerait un tiers à quiconque lirait la réponse.
export class RentalRequestMapper {
  public static toGetRentalRequestDto(
    view: PresentedRentalRequest,
  ): GetRentalRequestResponseDto {
    return {
      id: view.id,
      listingId: view.listingId,
      address: view.address,
      box: view.box,
      fromDay: view.fromDay,
      toDay: view.toDay,
      priceInCents: view.priceInCents,
      status: view.status,
      money: view.money,
      requestedAt: view.requestedAt.toISOString(),
      confirmedAt:
        view.confirmedAt === null ? null : view.confirmedAt.toISOString(),
      startsAt: view.startsAt.toISOString(),
      freeCancellationUntil:
        view.freeCancellationUntil === null
          ? null
          : view.freeCancellationUntil.toISOString(),
      answerBy: view.answerBy === null ? null : view.answerBy.toISOString(),
      accessInstructions: view.accessInstructions,
      ownerShareInCents: view.ownerShareInCents,
      arrivedAt: view.arrivedAt === null ? null : view.arrivedAt.toISOString(),
      issue:
        view.issue === null
          ? null
          : {
              reason: view.issue.reason,
              message: view.issue.message,
              reportedAt: view.issue.reportedAt.toISOString(),
              status: view.issue.status,
              ownerReply: view.issue.ownerReply,
              ownerRepliedAt:
                view.issue.ownerRepliedAt === null
                  ? null
                  : view.issue.ownerRepliedAt.toISOString(),
              refundInCents: view.issue.refundInCents,
              resolvedAt:
                view.issue.resolvedAt === null
                  ? null
                  : view.issue.resolvedAt.toISOString(),
            },
      issueReportable: view.issueReportable,
    };
  }
}
