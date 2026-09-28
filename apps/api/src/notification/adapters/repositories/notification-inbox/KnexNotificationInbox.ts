import type { Knex } from 'knex';

import { NotificationKind } from '../../../../shared/notification-outbox/domain/entities/Notification';
import {
  audienceOf,
  NotificationView,
} from '../../../domain/entities/NotificationView';
import { NotificationInbox } from '../../../domain/ports/NotificationInbox';

const NOTIFICATIONS = 'notifications';
const RENTAL_REQUESTS = 'rental_requests';
const LISTINGS = 'listings';

interface InboxRow {
  id: string;
  kind: string;
  recipient_id: string;
  created_at: Date | string;
  read_at: Date | string | null;
  rental_request_id: string;
  renter_id: string;
  from_day: string;
  to_day: string;
  address: string;
  box: string;
}

// Le contexte `notification` lit `rental_requests` et `listings` sans importer
// une classe de `rental/` ni de `listing/`, comme `KnexPublishedListingReader`
// lit les annonces : un renommage de colonne là-bas ne se voit qu'ici, à
// l'exécution.
export class KnexNotificationInbox implements NotificationInbox {
  constructor(private readonly connection: Knex) {}

  public async findLatestFor(
    recipientId: string,
    limit: number,
  ): Promise<NotificationView[]> {
    const rows = (await this.connection(NOTIFICATIONS)
      .join(
        RENTAL_REQUESTS,
        `${RENTAL_REQUESTS}.id`,
        `${NOTIFICATIONS}.rental_request_id`,
      )
      .join(LISTINGS, `${LISTINGS}.id`, `${RENTAL_REQUESTS}.listing_id`)
      .where(`${NOTIFICATIONS}.recipient_id`, recipientId)
      .orderBy([
        { column: `${NOTIFICATIONS}.created_at`, order: 'desc' },
        { column: `${NOTIFICATIONS}.id`, order: 'desc' },
      ])
      .limit(limit)
      .select(
        `${NOTIFICATIONS}.id as id`,
        `${NOTIFICATIONS}.kind as kind`,
        `${NOTIFICATIONS}.recipient_id as recipient_id`,
        `${NOTIFICATIONS}.created_at as created_at`,
        `${NOTIFICATIONS}.read_at as read_at`,
        `${NOTIFICATIONS}.rental_request_id as rental_request_id`,
        `${RENTAL_REQUESTS}.renter_id as renter_id`,
        `${RENTAL_REQUESTS}.from_day as from_day`,
        `${RENTAL_REQUESTS}.to_day as to_day`,
        `${LISTINGS}.address as address`,
        `${LISTINGS}.box as box`,
      )) as InboxRow[];

    return rows.map((row) => {
      const kind = row.kind as NotificationKind;
      return {
        id: row.id,
        kind,
        audience: audienceOf(kind, row.recipient_id === row.renter_id),
        createdAt: new Date(row.created_at),
        readAt: row.read_at === null ? null : new Date(row.read_at),
        requestId: row.rental_request_id,
        address: row.address,
        box: row.box,
        fromDay: row.from_day,
        toDay: row.to_day,
      };
    });
  }

  public async countUnreadFor(recipientId: string): Promise<number> {
    const [row] = (await this.connection(NOTIFICATIONS)
      .where({ recipient_id: recipientId })
      .whereNull('read_at')
      .count({ unread: '*' })) as { unread: string | number }[];
    return Number(row?.unread ?? 0);
  }

  public async markReadFor(
    recipientId: string,
    notificationId: string,
    readAt: Date,
  ): Promise<void> {
    await this.connection(NOTIFICATIONS)
      .where({ id: notificationId, recipient_id: recipientId })
      .whereNull('read_at')
      .update({ read_at: readAt });
  }

  public async markAllReadFor(
    recipientId: string,
    readAt: Date,
  ): Promise<void> {
    await this.connection(NOTIFICATIONS)
      .where({ recipient_id: recipientId })
      .whereNull('read_at')
      .update({ read_at: readAt });
  }
}
