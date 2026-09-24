import { GenericTransaction } from './GenericTransaction';
import { UnitOfWork } from './UnitOfWork';

// Le barreau `unit` n'ouvre jamais de transaction : l'objet vide est inutile
// exprès, pour qu'une doublure qui en dépendrait en secret casse aussitôt.
export class InMemoryUnitOfWork implements UnitOfWork {
  public async process<T>(
    work: (trx: GenericTransaction) => Promise<T>,
  ): Promise<T> {
    return work({} as GenericTransaction);
  }
}
