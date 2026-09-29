import type { Knex } from 'knex';

import { GenericTransaction } from './GenericTransaction';
import { UnitOfWork } from './UnitOfWork';

export class KnexUnitOfWork implements UnitOfWork {
  constructor(private readonly connection: Knex) {}

  // La forme à fonction de Knex valide si `work` réussit, annule et relance
  // sinon : l'erreur qui remonte est celle que `work` a levée, intacte, ce qui
  // garde `instanceof EmailAlreadyUsedError` vrai de l'autre côté.
  public async process<T>(
    work: (trx: GenericTransaction) => Promise<T>,
  ): Promise<T> {
    return this.connection.transaction((trx) => work(trx));
  }
}
