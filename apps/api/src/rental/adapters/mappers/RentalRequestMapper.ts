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
    };
  }
}
