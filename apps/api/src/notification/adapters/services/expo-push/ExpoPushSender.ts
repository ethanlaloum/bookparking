import { Logger } from '@nestjs/common';

import {
  PushMessage,
  PushOutcome,
  PushSender,
} from '../../../domain/ports/PushSender';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

// Expo prend au plus cent messages par requête.
const MESSAGES_PER_REQUEST = 100;

// Comme pour Resend : une requête qui pend gèlerait le balayage.
const REQUEST_TIMEOUT_IN_MILLISECONDS = 10_000;

// Ces deux refus disent un défaut de réglage ou de débit, pas un message
// fautif : le lot entier attend le balayage suivant.
const RETRYABLE_ERRORS = new Set(['InvalidCredentials', 'MessageRateExceeded']);

interface ExpoTicket {
  status: 'ok' | 'error';
  details?: { error?: string };
}

// Le SDK d'Expo n'apporterait qu'un appel `fetch`, comme celui de Resend.
export class ExpoPushSender implements PushSender {
  private readonly logger = new Logger('ExpoPushSender');

  constructor(
    private readonly accessToken: string | null,
    private readonly fetchImplementation: typeof fetch = fetch,
  ) {}

  public async send(
    messages: PushMessage[],
  ): Promise<PushOutcome[] | 'UNAVAILABLE'> {
    const outcomes: PushOutcome[] = [];
    for (
      let start = 0;
      start < messages.length;
      start += MESSAGES_PER_REQUEST
    ) {
      const chunk = await this.sendChunk(
        messages.slice(start, start + MESSAGES_PER_REQUEST),
      );
      if (chunk === 'UNAVAILABLE') return 'UNAVAILABLE';
      outcomes.push(...chunk);
    }
    return outcomes;
  }

  private async sendChunk(
    messages: PushMessage[],
  ): Promise<PushOutcome[] | 'UNAVAILABLE'> {
    let response: Response;
    try {
      response = await this.fetchImplementation(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...(this.accessToken === null
            ? {}
            : { Authorization: `Bearer ${this.accessToken}` }),
        },
        body: JSON.stringify(
          messages.map((message) => ({ ...message, sound: 'default' })),
        ),
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

    if (!response.ok) {
      await response.body?.cancel();
      this.logger.warn({ outcome: 'UNAVAILABLE', status: response.status });
      return 'UNAVAILABLE';
    }

    const tickets = await ticketsOf(response);
    if (tickets === null || tickets.length !== messages.length) {
      this.logger.warn({
        outcome: 'UNAVAILABLE',
        reason: 'unreadable tickets',
      });
      return 'UNAVAILABLE';
    }

    // Le nom de l'erreur seulement : jamais le jeton, qui désigne un téléphone.
    const errors = tickets
      .map((ticket) => ticket.details?.error)
      .filter((error): error is string => error !== undefined);
    if (errors.some((error) => RETRYABLE_ERRORS.has(error))) {
      this.logger.warn({ outcome: 'UNAVAILABLE', expoErrors: errors });
      return 'UNAVAILABLE';
    }
    if (errors.length > 0) this.logger.warn({ expoErrors: errors });

    return tickets.map((ticket) => {
      if (ticket.status === 'ok') return 'SENT';
      return ticket.details?.error === 'DeviceNotRegistered'
        ? 'GONE'
        : 'REFUSED';
    });
  }
}

const ticketsOf = async (response: Response): Promise<ExpoTicket[] | null> => {
  try {
    const body: unknown = await response.json();
    if (typeof body !== 'object' || body === null || !('data' in body))
      return null;
    const data = (body as { data: unknown }).data;
    return Array.isArray(data) ? (data as ExpoTicket[]) : null;
  } catch {
    return null;
  }
};
