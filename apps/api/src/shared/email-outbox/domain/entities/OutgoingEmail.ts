import { randomUUID } from 'node:crypto';

import { NotificationKind } from '../../../notification-outbox/domain/entities/Notification';

// Les e-mails que l'api sait rédiger : la bienvenue, et un par type de
// notification. Un moment clé de plus ajoute son type ici, dans
// `outgoing_emails_kind_check` et dans `composeEmail` — les trois ensemble,
// sans quoi l'insertion ou la rédaction échoue.
export type OutgoingEmailKind = 'WELCOME' | NotificationKind;

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

  // L'e-mail d'une notification ne dit ni l'adresse de la place ni les dates :
  // il renvoie au site, où la cloche les montre à qui est connecté.
  public static aboutNotification(params: {
    kind: NotificationKind;
    recipient: string;
    queuedAt: Date;
  }): OutgoingEmail {
    return new OutgoingEmail({
      id: randomUUID(),
      kind: params.kind,
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
