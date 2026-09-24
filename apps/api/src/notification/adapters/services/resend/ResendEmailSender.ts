import { Logger } from '@nestjs/common';

import {
  EmailDelivery,
  EmailMessage,
  EmailSender,
} from '../../../domain/ports/EmailSender';

const RESEND_EMAILS_URL = 'https://api.resend.com/emails';

// Une requête qui pend bloquerait le balayage : le suivant est sauté tant que
// celui-ci n'a pas rendu la main (`SweepScheduler`).
const REQUEST_TIMEOUT_IN_MILLISECONDS = 10_000;

// Seuls ces deux statuts jugent l'e-mail lui-même (Q-02). Une clé ou un
// domaine refusés (401, 403) sont un défaut de réglage : l'e-mail reste en
// file et repart dès la correction.
const REFUSED_STATUSES = new Set([400, 422]);

// Le SDK de Resend n'apporterait qu'un appel `fetch` : l'api n'ajoute pas de
// dépendance pour si peu.
export class ResendEmailSender implements EmailSender {
  private readonly logger = new Logger('ResendEmailSender');

  constructor(
    private readonly apiKey: string,
    private readonly from: string,
    private readonly fetchImplementation: typeof fetch = fetch,
  ) {}

  public async send(message: EmailMessage): Promise<EmailDelivery> {
    let response: Response;
    try {
      response = await this.fetchImplementation(RESEND_EMAILS_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': message.idempotencyKey,
        },
        body: JSON.stringify({
          from: this.from,
          to: [message.to],
          subject: message.subject,
          html: message.html,
          text: message.text,
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_IN_MILLISECONDS),
      });
    } catch (error: unknown) {
      this.logger.warn({
        outcome: 'UNAVAILABLE',
        errorClass:
          error instanceof Error ? error.constructor.name : typeof error,
      });
      return 'UNAVAILABLE';
    }

    if (response.ok) {
      await response.body?.cancel();
      return 'ACCEPTED';
    }

    const delivery: EmailDelivery = REFUSED_STATUSES.has(response.status)
      ? 'REFUSED'
      : 'UNAVAILABLE';
    // Le statut et le code d'erreur de Resend seulement : son message peut
    // citer une adresse, et rien ici ne doit citer la clé.
    this.logger.warn({
      outcome: delivery,
      status: response.status,
      resendError: await errorNameOf(response),
    });
    return delivery;
  }
}

const errorNameOf = async (response: Response): Promise<string | null> => {
  try {
    const body: unknown = await response.json();
    if (typeof body === 'object' && body !== null && 'name' in body)
      return String((body as { name: unknown }).name);
    return null;
  } catch {
    return null;
  }
};
