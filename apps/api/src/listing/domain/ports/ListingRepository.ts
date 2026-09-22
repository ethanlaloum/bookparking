import { GenericTransaction } from '../../../shared/unit-of-work/GenericTransaction';
import { Listing } from '../entities/Listing';

export interface ListingRepository {
  create(listing: Listing, trx?: GenericTransaction): Promise<void>;
  save(listing: Listing, trx?: GenericTransaction): Promise<void>;
  findActiveById(
    listingId: string,
    trx?: GenericTransaction,
  ): Promise<Listing | null>;
  findAllActive(trx?: GenericTransaction): Promise<Listing[]>;
  // Rend les annonces du propriétaire quel que soit leur statut : le tableau de
  // bord doit montrer une place dépubliée, qui n'apparaît par définition dans
  // aucune lecture publique.
  findAllByOwner(
    ownerId: string,
    trx?: GenericTransaction,
  ): Promise<Listing[]>;
  findActiveByPlaceKey(
    placeKey: string,
    trx?: GenericTransaction,
  ): Promise<Listing | null>;
}
