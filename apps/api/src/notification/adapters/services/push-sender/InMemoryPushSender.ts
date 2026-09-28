import {
  PushMessage,
  PushOutcome,
  PushSender,
} from '../../../domain/ports/PushSender';

// Tout ce qui est confié au service est gardé dans `received`. À défaut de
// réponse programmée, chaque message part.
export class InMemoryPushSender implements PushSender {
  public received: PushMessage[] = [];
  public unavailable = false;
  public goneTokens = new Set<string>();

  public async send(
    messages: PushMessage[],
  ): Promise<PushOutcome[] | 'UNAVAILABLE'> {
    if (this.unavailable) return 'UNAVAILABLE';
    this.received.push(...messages);
    return messages.map((message) =>
      this.goneTokens.has(message.to) ? 'GONE' : 'SENT',
    );
  }
}
