import type { Knex } from 'knex';

import { GenericTransaction } from '../../../unit-of-work/GenericTransaction';
import {
  DEFAULT_PLATFORM_SETTINGS,
  PlatformSettings,
} from '../../domain/entities/PlatformSettings';
import { PlatformSettingsReader } from '../../domain/ports/PlatformSettingsReader';
import { SchemaPlatformSettings } from './SchemaPlatformSettings';

export const PLATFORM_SETTINGS_TABLE = 'platform_settings';

export const toPlatformSettings = (
  row: Pick<
    SchemaPlatformSettings,
    | 'platform_fee_percent'
    | 'free_cancellation_hours'
    | 'request_expiry_hours'
    | 'payout_release_delay_hours'
  >,
): PlatformSettings => ({
  platformFeePercent: Number(row.platform_fee_percent),
  freeCancellationHours: Number(row.free_cancellation_hours),
  requestExpiryHours: Number(row.request_expiry_hours),
  payoutReleaseDelayHours: Number(row.payout_release_delay_hours),
});

// La version en vigueur est la dernière écrite. Une base sans aucune version —
// celle d'un test, vidée entre deux cas — applique les valeurs d'avant le
// back-office ; la migration en écrit une en production.
export class KnexPlatformSettingsReader implements PlatformSettingsReader {
  constructor(private readonly connection: Knex) {}

  public async current(trx?: GenericTransaction): Promise<PlatformSettings> {
    const query = this.connection<SchemaPlatformSettings>(
      PLATFORM_SETTINGS_TABLE,
    )
      .orderBy([
        { column: 'effective_from', order: 'desc' },
        { column: 'id', order: 'desc' },
      ])
      .first();
    if (trx) query.transacting(trx);
    const row = (await query) as SchemaPlatformSettings | undefined;
    return row === undefined
      ? DEFAULT_PLATFORM_SETTINGS
      : toPlatformSettings(row);
  }
}
