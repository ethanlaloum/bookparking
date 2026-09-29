import type { Knex } from 'knex';

import { OutgoingEmail } from '../../../email-outbox/domain/entities/OutgoingEmail';
import { EmailOutbox } from '../../../email-outbox/domain/ports/EmailOutbox';
import { GenericTransaction } from '../../../unit-of-work/GenericTransaction';
import { Notification } from '../../domain/entities/Notification';
import { NotificationOutbox } from '../../domain/ports/NotificationOutbox';
import { SchemaNotificationOutbox } from './SchemaNotificationOutbox';

const ACCOUNTS_TABLE = 'accounts';

export class KnexNotificationOutbox implements NotificationOutbox {
  private readonly tableName = 'notifications';

  constructor(
    private readonly connection: Knex,
    private readonly emailOutbox: EmailOutbox,
  ) {}

  // L'index unique `notifications_once_per_recipient_unique` départage les
  // rejeux : la seconde insertion n'écrit rien, et rien ne part par e-mail.
  // L'adresse est lue au moment de la mise en file, comme pour la bienvenue ;
  // un destinataire sans compte n'a que la cloche — il n'en a pas non plus.
  public async notify(
    notification: Notification,
    trx?: GenericTransaction,
  ): Promise<void> {
    const insert = this.connection<SchemaNotificationOutbox>(this.tableName)
      .insert(KnexNotificationOutbox.toRow(notification))
      .onConflict(['rental_request_id', 'kind', 'recipient_id'])
      .ignore()
      .returning('id');
    if (trx) insert.transacting(trx);
    if ((await insert).length === 0) return;

    // `recipient_id` est du texte et `accounts.id` un UUID : comparer en texte
    // évite qu'un identifiant qui n'est pas un UUID fasse échouer la requête.
    const read = this.connection(ACCOUNTS_TABLE)
      .whereRaw('id::text = ?', [notification.recipientId])
      .first('email');
    if (trx) read.transacting(trx);
    const account = (await read) as { email: string } | undefined;
    if (!account) return;

    await this.emailOutbox.enqueue(
      OutgoingEmail.aboutNotification({
        kind: notification.kind,
        recipient: account.email,
        queuedAt: notification.createdAt,
      }),
      trx,
    );
  }

  private static toRow(notification: Notification): SchemaNotificationOutbox {
    const state = notification.toState();
    return {
      id: state.id,
      kind: state.kind,
      recipient_id: state.recipientId,
      rental_request_id: state.rentalRequestId,
      created_at: state.createdAt,
      read_at: state.readAt,
    };
  }
}
