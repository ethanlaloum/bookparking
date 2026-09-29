export interface EmailMessage {
  idempotencyKey: string;
  to: string;
  subject: string;
  html: string;
  text: string;
}

// ACCEPTED : le fournisseur a pris l'e-mail. UNAVAILABLE : il ne l'a pas pris
// pour une raison qui peut passer (panne, débit, réseau, clé refusée).
// REFUSED : il juge l'e-mail lui-même invalide — le renvoyer n'y changerait rien.
export type EmailDelivery = 'ACCEPTED' | 'UNAVAILABLE' | 'REFUSED';

export interface EmailSender {
  send(message: EmailMessage): Promise<EmailDelivery>;
}
