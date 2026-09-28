import { RentalRequestView } from '../ports/RentalRepository';

const MILLISECONDS_PER_HOUR = 60 * 60 * 1000;

// Ce qu'une liste de demandes rend à son lecteur : la vue lue en base, moins
// ce qu'il n'a pas à voir, plus l'échéance de réponse.
export interface PresentedRentalRequest extends Omit<
  RentalRequestView,
  'accessInstructions' | 'holdPlacedAt' | 'endsAt' | 'platformFeeInCents'
> {
  accessInstructions: string | null;
  answerBy: Date | null;
  // Ce que le loueur touchera, commission déduite ; `null` pour le
  // conducteur, que la répartition ne regarde pas.
  ownerShareInCents: number | null;
}

// Les consignes d'accès (digicode, étage, repères) ne vont qu'au conducteur
// d'une réservation confirmée, et jusqu'à la fin du dernier jour loué : après,
// il n'a plus à entrer. Le loueur, qui les a écrites, les relit sur son annonce.
const revealedTo = (
  reader: 'RENTER' | 'OWNER',
  view: RentalRequestView,
  now: Date,
): string | null =>
  reader === 'RENTER' &&
  view.status === 'CONFIRMED' &&
  now.getTime() < view.endsAt.getTime()
    ? view.accessInstructions
    : null;

// L'échéance que le balayage applique : quarante-huit heures (réglables) après
// l'empreinte, ou après la demande pour celles d'avant l'encaissement.
const answerByOf = (
  view: RentalRequestView,
  expiryInHours: number,
): Date | null =>
  view.status === 'PENDING'
    ? new Date(
        (view.holdPlacedAt ?? view.requestedAt).getTime() +
          expiryInHours * MILLISECONDS_PER_HOUR,
      )
    : null;

export const presentRentalRequest = (
  view: RentalRequestView,
  reader: 'RENTER' | 'OWNER',
  now: Date,
  expiryInHours: number,
): PresentedRentalRequest => {
  const {
    holdPlacedAt: _hold,
    endsAt: _end,
    platformFeeInCents: fee,
    ...shown
  } = view;
  return {
    ...shown,
    accessInstructions: revealedTo(reader, view, now),
    answerBy: answerByOf(view, expiryInHours),
    ownerShareInCents:
      reader === 'OWNER' ? view.priceInCents - (fee ?? 0) : null,
  };
};
