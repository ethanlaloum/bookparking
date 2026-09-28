export interface GetRentalRequestResponseDto {
  id: string;
  listingId: string;
  address: string;
  box: string;
  fromDay: string;
  toDay: string;
  priceInCents: number;
  status: string;
  money: string;
  requestedAt: string;
  confirmedAt: string | null;
  startsAt: string;
  freeCancellationUntil: string | null;
  answerBy: string | null;
  // Non nulle pour le seul conducteur d'une réservation confirmée, jusqu'à la
  // fin de la location.
  accessInstructions: string | null;
  // Pour le seul loueur : le prix moins la commission figée à la demande.
  ownerShareInCents: number | null;
  arrivedAt: string | null;
}
