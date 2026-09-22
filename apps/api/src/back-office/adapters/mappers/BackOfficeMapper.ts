import {
  AdminAccountView,
  AdminListingView,
  AdminRentalRequestView,
} from '../../domain/ports/BackOfficeRepository';
import {
  AdminAccountResponseDto,
  AdminListingResponseDto,
  AdminRentalRequestResponseDto,
} from '../rest/dtos/BackOfficeResponseDtos';

// `ownerId` ne traverse pas : l'adresse e-mail désigne déjà le compte pour un
// administrateur, et l'identifiant interne n'apporterait qu'une surface de plus.
export class BackOfficeMapper {
  public static toAccountDto(view: AdminAccountView): AdminAccountResponseDto {
    return {
      id: view.id,
      email: view.email,
      registeredAt: view.registeredAt.toISOString(),
      suspendedAt:
        view.suspendedAt === null ? null : view.suspendedAt.toISOString(),
      listingCount: view.listingCount,
      requestCount: view.requestCount,
    };
  }

  public static toListingDto(view: AdminListingView): AdminListingResponseDto {
    return {
      id: view.id,
      address: view.address,
      box: view.box,
      ownerEmail: view.ownerEmail,
      status: view.status,
      acceptedVehicles: view.acceptedVehicles,
      pricing: {
        dayInCents: view.dayInCents,
        weekInCents: view.weekInCents,
        monthInCents: view.monthInCents,
      },
      publishedAt: view.publishedAt.toISOString(),
    };
  }

  public static toRentalRequestDto(
    view: AdminRentalRequestView,
  ): AdminRentalRequestResponseDto {
    return {
      id: view.id,
      address: view.address,
      box: view.box,
      ownerEmail: view.ownerEmail,
      renterEmail: view.renterEmail,
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
