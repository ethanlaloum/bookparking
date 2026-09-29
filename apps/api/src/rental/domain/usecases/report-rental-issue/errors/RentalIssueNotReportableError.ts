import { ReportRefusal } from '../../../entities/RentalIssue';

const MESSAGES: Record<ReportRefusal, string> = {
  ALREADY_REPORTED:
    'Un problème a déjà été signalé sur cette réservation : Bookparking l’examine',
  NOT_CONFIRMED:
    'Seule une réservation confirmée et payée peut faire l’objet d’une réclamation',
  NOT_STARTED:
    'Vous pourrez signaler un problème à partir du début de la location',
  ENDED:
    'La location est terminée : il n’est plus possible de signaler un problème',
  ARRIVED:
    'Vous avez confirmé votre arrivée : il n’est plus possible de signaler un problème',
  PAID_OUT:
    'L’argent de cette location a déjà été versé au loueur : il n’est plus possible de signaler un problème',
};

export class RentalIssueNotReportableError extends Error {
  protected readonly _tag = 'RentalIssueNotReportableError';
  public readonly refusal: ReportRefusal;

  constructor(refusal: ReportRefusal) {
    super(MESSAGES[refusal]);
    this.name = 'RentalIssueNotReportableError';
    this.refusal = refusal;
  }
}
