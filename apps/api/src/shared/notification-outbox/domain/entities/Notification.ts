import { randomUUID } from 'node:crypto';

// Les moments d'une demande de location dont on prévient quelqu'un. Chaque type
// désigne son destinataire : le loueur (reçue, restée sans réponse, annulée par
// le conducteur), le conducteur (acceptée, refusée, expirée, annulée par le
// loueur, paiement refusé), ou les deux (annulée par Bookparking).
//
// Un type de plus s'ajoute ici, dans `notifications_kind_check`, dans
// `outgoing_emails_kind_check` et dans `composeEmail` — les quatre ensemble.
export type NotificationKind =
  | 'RENTAL_REQUEST_RECEIVED'
  | 'RENTAL_REQUEST_ACCEPTED'
  | 'RENTAL_REQUEST_DECLINED'
  | 'RENTAL_REQUEST_EXPIRED'
  | 'RENTAL_REQUEST_UNANSWERED'
  | 'RENTAL_CANCELLED_BY_RENTER'
  | 'RENTAL_CANCELLED_BY_OWNER'
  | 'RENTAL_CANCELLED_BY_OPERATOR'
  | 'RENTAL_PAYMENT_FAILED'
  | 'RENTAL_PAYOUT_SENT';

interface Props {
  id: string;
  kind: NotificationKind;
  recipientId: string;
  rentalRequestId: string;
  createdAt: Date;
  readAt: Date | null;
}

export class Notification {
  private constructor(private readonly props: Props) {}

  public toState(): Props {
    return this.props;
  }

  public static fromState(state: Props): Notification {
    return new Notification(state);
  }

  public static about(params: {
    kind: NotificationKind;
    recipientId: string;
    rentalRequestId: string;
    createdAt: Date;
  }): Notification {
    return new Notification({
      id: randomUUID(),
      kind: params.kind,
      recipientId: params.recipientId,
      rentalRequestId: params.rentalRequestId,
      createdAt: params.createdAt,
      readAt: null,
    });
  }

  public get id(): string {
    return this.props.id;
  }

  public get kind(): NotificationKind {
    return this.props.kind;
  }

  public get recipientId(): string {
    return this.props.recipientId;
  }

  public get rentalRequestId(): string {
    return this.props.rentalRequestId;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }
}
