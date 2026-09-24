import { randomUUID } from 'node:crypto';

// Les e-mails que l'api sait rédiger. Un moment clé de plus ajoute son type
// ici, dans `outgoing_emails_kind_check` et dans `composeEmail` — les trois
// ensemble, sans quoi l'insertion ou la rédaction échoue.
export type OutgoingEmailKind = 'WELCOME';

export type OutgoingEmailStatus = 'PENDING' | 'SENT' | 'FAILED';

interface Props {
  id: string;
  kind: OutgoingEmailKind;
  recipient: string;
  status: OutgoingEmailStatus;
  attempts: number;
  queuedAt: Date;
  sentAt: Date | null;
  failedAt: Date | null;
}

export class OutgoingEmail {
  private constructor(private readonly props: Props) {}

  public toState(): Props {
    return this.props;
  }

  public static fromState(state: Props): OutgoingEmail {
    return new OutgoingEmail(state);
  }

  // L'identifiant naît ici, et c'est aussi la clé d'idempotence de l'envoi :
  // deux balayages qui envoient le même e-mail envoient la même clé.
  public static welcome(params: {
    recipient: string;
    queuedAt: Date;
  }): OutgoingEmail {
    return new OutgoingEmail({
      id: randomUUID(),
      kind: 'WELCOME',
      recipient: params.recipient,
      status: 'PENDING',
      attempts: 0,
      queuedAt: params.queuedAt,
      sentAt: null,
      failedAt: null,
    });
  }

  public get id(): string {
    return this.props.id;
  }

  public get kind(): OutgoingEmailKind {
    return this.props.kind;
  }

  public get recipient(): string {
    return this.props.recipient;
  }

  public get queuedAt(): Date {
    return this.props.queuedAt;
  }
}
