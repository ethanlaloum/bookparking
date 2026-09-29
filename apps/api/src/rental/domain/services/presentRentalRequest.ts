import { reportRefusalOf } from '../entities/RentalIssue';
import { answerDeadlineOf } from '../entities/RentalMoney';
import { RentalRequestView } from '../ports/RentalRepository';

// Ce qu'une liste de demandes rend à son lecteur : la vue lue en base, moins
// ce qu'il n'a pas à voir, plus l'échéance de réponse.
export interface PresentedRentalRequest extends Omit<
  RentalRequestView,
  | 'accessInstructions'
  | 'holdPlacedAt'
  | 'endsAt'
  | 'platformFeeInCents'
  | 'requestExpiryHours'
  | 'transferred'
> {
  accessInstructions: string | null;
  answerBy: Date | null;
  // Ce que le loueur touchera, commission déduite ; `null` pour le
  // conducteur, que la répartition ne regarde pas.
  ownerShareInCents: number | null;
  // Le seul conducteur peut signaler un problème, et seulement pendant la
  // location — la même règle que `ReportRentalIssue` applique.
  issueReportable: boolean;
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

// L'échéance que le balayage applique : le délai figé sur la demande, après
// l'empreinte, ou après la demande pour celles d'avant l'encaissement.
const answerByOf = (view: RentalRequestView): Date | null =>
  view.status === 'PENDING'
    ? answerDeadlineOf(
        view.holdPlacedAt ?? view.requestedAt,
        view.requestExpiryHours,
      )
    : null;

export const presentRentalRequest = (
  view: RentalRequestView,
  reader: 'RENTER' | 'OWNER',
  now: Date,
): PresentedRentalRequest => {
  const {
    holdPlacedAt: _hold,
    endsAt: _end,
    platformFeeInCents: fee,
    requestExpiryHours: _expiry,
    transferred,
    ...shown
  } = view;
  return {
    ...shown,
    accessInstructions: revealedTo(reader, view, now),
    answerBy: answerByOf(view),
    ownerShareInCents:
      reader === 'OWNER' ? view.priceInCents - (fee ?? 0) : null,
    issueReportable:
      reader === 'RENTER' &&
      reportRefusalOf(
        {
          status: view.status,
          money: view.money,
          startsAt: view.startsAt,
          endsAt: view.endsAt,
          arrivedAt: view.arrivedAt,
          transferred,
          hasIssue: view.issue !== null,
        },
        now,
      ) === null,
  };
};
