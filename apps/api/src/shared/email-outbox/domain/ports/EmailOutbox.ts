import { GenericTransaction } from '../../../unit-of-work/GenericTransaction';
import { OutgoingEmail } from '../entities/OutgoingEmail';

// Chaque transition filtre sur `PENDING` : rejouée, elle ne trouve plus rien
// à écrire. C'est là qu'est l'idempotence du balayage, pas dans son code.
export interface EmailOutbox {
  enqueue(email: OutgoingEmail, trx?: GenericTransaction): Promise<void>;
  findQueued(limit: number): Promise<OutgoingEmail[]>;
  markSent(emailId: string, sentAt: Date): Promise<void>;
  recordUnavailable(emailId: string): Promise<void>;
  markFailed(emailId: string, failedAt: Date): Promise<void>;
}
