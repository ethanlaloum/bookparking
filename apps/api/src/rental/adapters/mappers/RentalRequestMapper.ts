import { RentalRequestView } from '../../domain/ports/RentalRepository';
import { GetRentalRequestResponseDto } from '../rest/dtos/GetRentalRequestResponseDto';

// `renterId` et `ownerId` ne traversent pas : les deux routes sont déjà clés
// sur le compte qui appelle, donc les rendre n'apprendrait rien à son
// destinataire légitime et désignerait un tiers à quiconque lirait la réponse.
export class RentalRequestMapper {
  public static toGetRentalRequestDto(
    view: RentalRequestView,
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
      requestedAt: view.requestedAt.toISOString(),
      confirmedAt:
        view.confirmedAt === null ? null : view.confirmedAt.toISOString(),
    };
  }
}
