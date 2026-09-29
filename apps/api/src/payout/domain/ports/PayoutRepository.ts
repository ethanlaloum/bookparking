import { GenericTransaction } from '../../../shared/unit-of-work/GenericTransaction';
import { OwnerPayoutView } from '../entities/OwnerPayout';
import { PayoutAccount } from '../entities/PayoutAccount';

// Une location dont l'argent est libéré et pas encore viré.
export interface DuePayout {
  requestId: string;
  ownerId: string;
  paymentId: string;
  priceInCents: number;
  platformFeeInCents: number | null;
  // Ce que Bookparking a rendu au conducteur en tranchant une réclamation.
  refundInCents: number;
  account: PayoutAccount | null;
}

export interface OwnerTransfer {
  requestId: string;
  ownerId: string;
  amountInCents: number;
  stripeTransferId: string;
  transferredAt: Date;
}

export interface PayoutRepository {
  findAccount(accountId: string): Promise<PayoutAccount | null>;
  // Ne fait rien si le compte existe déjà : deux clics concurrents sur
  // « Ajouter mes coordonnées » n'écrivent qu'un compte.
  createAccount(account: PayoutAccount, at: Date): Promise<void>;
  setPayoutsEnabled(
    accountId: string,
    payoutsEnabled: boolean,
    at: Date,
  ): Promise<void>;
  findEmailOf(accountId: string): Promise<string | null>;
  findPayoutsForOwner(ownerId: string): Promise<OwnerPayoutView[]>;
  // Libéré (arrivée, ou premier instant + délai figé sur la demande passé),
  // prélevé chez Stripe (`CAPTURED`), sans réclamation ouverte et sans
  // virement : l'argent attend d'être viré.
  findDuePayouts(now: Date, limit: number): Promise<DuePayout[]>;
  recordTransfer(
    transfer: OwnerTransfer,
    trx?: GenericTransaction,
  ): Promise<void>;
}
