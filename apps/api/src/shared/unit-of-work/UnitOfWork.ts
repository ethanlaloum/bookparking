import { GenericTransaction } from './GenericTransaction';

// Toute écriture qui en entraîne une autre passe par ici : les deux sont
// validées ensemble, ou aucune ne l'est.
export interface UnitOfWork {
  process<T>(work: (trx: GenericTransaction) => Promise<T>): Promise<T>;
}
