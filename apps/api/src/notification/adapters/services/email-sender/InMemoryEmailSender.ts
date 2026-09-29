import {
  EmailDelivery,
  EmailMessage,
  EmailSender,
} from '../../../domain/ports/EmailSender';

// Tout ce qui est confié au fournisseur est gardé dans `received`, qu'il
// l'ait pris ou non. Les réponses se programment une à une ; à défaut, il
// accepte.
export class InMemoryEmailSender implements EmailSender {
  public received: EmailMessage[] = [];
  private answers: EmailDelivery[] = [];

  public answerNext(...deliveries: EmailDelivery[]): void {
    this.answers.push(...deliveries);
  }

  public async send(message: EmailMessage): Promise<EmailDelivery> {
    this.received.push(message);
    return this.answers.shift() ?? 'ACCEPTED';
  }
}
