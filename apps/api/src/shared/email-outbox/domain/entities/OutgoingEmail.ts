import { randomUUID } from 'node:crypto';

import { NotificationKind } from '../../../notification-outbox/domain/entities/Notification';

export type OutgoingEmailKind = 'WELCOME' | 'PASSWORD_RESET' | NotificationKind;

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
  passwordResetToken: string | null;
}

export class OutgoingEmail {
  private constructor(private readonly props: Props) {}

  public toState(): Props {
    return this.props;
  }

  public static fromState(state: Props): OutgoingEmail {
    return new OutgoingEmail(state);
  }

  public static welcome(params: {
    recipient: string;
    queuedAt: Date;
  }): OutgoingEmail {
    return OutgoingEmail.queued('WELCOME', params.recipient, params.queuedAt);
  }

  public static aboutNotification(params: {
    kind: NotificationKind;
    recipient: string;
    queuedAt: Date;
  }): OutgoingEmail {
    return OutgoingEmail.queued(params.kind, params.recipient, params.queuedAt);
  }

  public static passwordReset(params: {
    recipient: string;
    token: string;
    queuedAt: Date;
  }): OutgoingEmail {
    return new OutgoingEmail({
      ...OutgoingEmail.queued(
        'PASSWORD_RESET',
        params.recipient,
        params.queuedAt,
      ).props,
      passwordResetToken: params.token,
    });
  }

  private static queued(
    kind: OutgoingEmailKind,
    recipient: string,
    queuedAt: Date,
  ): OutgoingEmail {
    return new OutgoingEmail({
      id: randomUUID(),
      kind,
      recipient,
      status: 'PENDING',
      attempts: 0,
      queuedAt,
      sentAt: null,
      failedAt: null,
      passwordResetToken: null,
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

  public get passwordResetToken(): string | null {
    return this.props.passwordResetToken;
  }
}
