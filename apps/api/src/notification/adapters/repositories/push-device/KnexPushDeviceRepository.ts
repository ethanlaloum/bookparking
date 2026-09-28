import type { Knex } from 'knex';

import { PushDeviceRepository } from '../../../domain/ports/PushDeviceRepository';

const PUSH_DEVICES = 'push_devices';

export class KnexPushDeviceRepository implements PushDeviceRepository {
  constructor(private readonly connection: Knex) {}

  // Le jeton est la clé : l'enregistrer de nouveau le donne au compte qui
  // l'enregistre, sans jamais le dédoubler.
  public async register(
    token: string,
    accountId: string,
    registeredAt: Date,
  ): Promise<void> {
    await this.connection(PUSH_DEVICES)
      .insert({
        token,
        account_id: accountId,
        registered_at: registeredAt,
      })
      .onConflict('token')
      .merge(['account_id', 'registered_at']);
  }

  public async forget(tokens: string[]): Promise<void> {
    if (tokens.length === 0) return;
    await this.connection(PUSH_DEVICES).whereIn('token', tokens).delete();
  }
}
