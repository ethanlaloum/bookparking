import type { Knex } from 'knex';

import { GenericTransaction } from '../../../../shared/unit-of-work/GenericTransaction';
import { AccountFootprint } from '../../../domain/ports/AccountFootprint';

/**
 * Copie les noms de tables et de statuts des autres contextes plutôt que
 * d'importer leurs classes, comme `KnexBackOfficeRepository` : un renommage
 * là-bas ne se verra qu'à l'exécution, et `KnexAccountFootprint.int.spec.ts`
 * est ce qui le verra.
 */
export class KnexAccountFootprint implements AccountFootprint {
  constructor(private readonly connection: Knex) {}

  public async hasOngoingCommitments(
    accountId: string,
    now: Date,
    trx?: GenericTransaction,
  ): Promise<boolean> {
    const query = this.connection('rental_requests as r')
      .join('listings as l', 'l.id', 'r.listing_id')
      .leftJoin('owner_transfers as t', 't.rental_request_id', 'r.id')
      .where((party) =>
        party
          .where((either) =>
            either
              .where('r.renter_id', accountId)
              .orWhere('l.owner_id', accountId),
          )
          .andWhere((live) =>
            live
              .where('r.status', 'PENDING')
              .orWhere((booked) =>
                booked
                  .where('r.status', 'CONFIRMED')
                  .andWhere('r.period_to', '>', now),
              ),
          ),
      )
      // Le même « dû » que `KnexPayoutRepository.findDuePayouts`, sans la
      // libération : prélevé, pas encore viré, quelle que soit la date.
      .orWhere((payout) =>
        payout
          .where('l.owner_id', accountId)
          .andWhere('r.money_status', 'CAPTURED')
          .whereNotNull('r.payment_id')
          .whereNull('t.rental_request_id'),
      )
      .first('r.id');
    if (trx) query.transacting(trx);
    return (await query) !== undefined;
  }

  public async erase(
    accountId: string,
    email: string,
    trx?: GenericTransaction,
  ): Promise<void> {
    const run = async (query: Knex.QueryBuilder): Promise<void> => {
      if (trx) query.transacting(trx);
      await query;
    };
    const now = new Date();
    const ownListingIds = this.connection('listings')
      .where({ owner_id: accountId })
      .select('id');

    // Une page de paiement encore ouverte, la sienne ou celle d'un conducteur
    // sur l'une de ses places : payée plus tard, l'empreinte d'une demande
    // abandonnée est levée par `RecordPaymentEvent`, jamais gardée.
    await run(
      this.connection('rental_requests')
        .where({ status: 'AWAITING_PAYMENT' })
        .andWhere((party) =>
          party
            .where({ renter_id: accountId })
            .orWhereIn('listing_id', ownListingIds),
        )
        .update({ status: 'ABANDONED', updated_at: now }),
    );
    // Dépubliées, jamais supprimées : les locations passées les référencent
    // encore (ADR-003).
    await run(
      this.connection('listings')
        .where({ owner_id: accountId, status: 'ACTIVE' })
        .update({ status: 'UNPUBLISHED', updated_at: now }),
    );
    await run(
      this.connection('notifications')
        .where({ recipient_id: accountId })
        .delete(),
    );
    await run(
      this.connection('push_devices').where({ account_id: accountId }).delete(),
    );
    await run(
      this.connection('outgoing_emails').where({ recipient: email }).delete(),
    );
    await run(
      this.connection('payout_accounts')
        .where({ account_id: accountId })
        .delete(),
    );
    await run(
      this.connection('listing_photos').where({ owner_id: accountId }).delete(),
    );
  }
}
