import type { Knex } from 'knex';

import { NotificationKind } from '../../../../shared/notification-outbox/domain/entities/Notification';
import { audienceOf } from '../../../domain/entities/NotificationView';
import { PendingPush, PushQueue } from '../../../domain/ports/PushQueue';

const NOTIFICATIONS = 'notifications';
const RENTAL_REQUESTS = 'rental_requests';
const PUSH_DEVICES = 'push_devices';

interface UnpushedRow {
  id: string;
  kind: string;
  recipient_id: string;
  created_at: Date | string;
  renter_id: string;
}

// La file des push, c'est `notifications` elle-même : une ligne non poussée
// l'attend, `notifications_unpushed_created_at_idx` ne porte qu'elles. Les
// téléphones sont lus à chaque balayage, pas figés à la notification : un
// téléphone oublié entre-temps n'est plus visé.
export class KnexPushQueue implements PushQueue {
  constructor(private readonly connection: Knex) {}

  public async findUnpushed(limit: number): Promise<PendingPush[]> {
    const rows = (await this.connection(NOTIFICATIONS)
      .join(
        RENTAL_REQUESTS,
        `${RENTAL_REQUESTS}.id`,
        `${NOTIFICATIONS}.rental_request_id`,
      )
      .whereNull(`${NOTIFICATIONS}.pushed_at`)
      .orderBy([
        { column: `${NOTIFICATIONS}.created_at`, order: 'asc' },
        { column: `${NOTIFICATIONS}.id`, order: 'asc' },
      ])
      .limit(limit)
      .select(
        `${NOTIFICATIONS}.id as id`,
        `${NOTIFICATIONS}.kind as kind`,
        `${NOTIFICATIONS}.recipient_id as recipient_id`,
        `${NOTIFICATIONS}.created_at as created_at`,
        `${RENTAL_REQUESTS}.renter_id as renter_id`,
      )) as UnpushedRow[];
    if (rows.length === 0) return [];

    const devices = (await this.connection(PUSH_DEVICES)
      .whereIn(
        'account_id',
        rows.map((row) => row.recipient_id),
      )
      .orderBy('registered_at', 'asc')
      .select('token', 'account_id')) as {
      token: string;
      account_id: string;
    }[];

    return rows.map((row) => {
      const kind = row.kind as NotificationKind;
      return {
        notificationId: row.id,
        kind,
        audience: audienceOf(kind, row.recipient_id === row.renter_id),
        createdAt: new Date(row.created_at),
        tokens: devices
          .filter((device) => device.account_id === row.recipient_id)
          .map((device) => device.token),
      };
    });
  }

  // Filtre sur `pushed_at IS NULL` : deux balayages qui se chevauchent ne
  // réécrivent pas l'instant du premier.
  public async markPushed(
    notificationIds: string[],
    pushedAt: Date,
  ): Promise<void> {
    if (notificationIds.length === 0) return;
    await this.connection(NOTIFICATIONS)
      .whereIn('id', notificationIds)
      .whereNull('pushed_at')
      .update({ pushed_at: pushedAt });
  }
}
