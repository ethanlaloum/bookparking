import { GenericTransaction } from '../../../shared/unit-of-work/GenericTransaction';

// Ce qu'un compte a laissé hors de `accounts` : ses annonces, ses demandes,
// ses notifications, ses téléphones, ses e-mails et son compte de versement.
// Lu et écrit par jointure, sans importer une classe des autres contextes.
export interface AccountFootprint {
  // Une demande qui attend la réponse du loueur, une location pas encore
  // finie, ou de l'argent prélevé qui n'a pas été viré au loueur.
  hasOngoingCommitments(
    accountId: string,
    now: Date,
    trx?: GenericTransaction,
  ): Promise<boolean>;
  erase(
    accountId: string,
    email: string,
    trx?: GenericTransaction,
  ): Promise<void>;
}
