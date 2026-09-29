import { Either } from 'effect/index';

import { getTestDbConnection } from '../../../../infra/testcontainers-setup';
import { KnexListingRepository } from '../../../../listing/adapters/repositories/listing/KnexListingRepository';
import { ListingBuilder } from '../../../../listing/domain/builders/ListingBuilder';
import { reportIssue } from '../../../domain/entities/RentalIssue';
import { RentalRequest } from '../../../domain/entities/RentalRequest';
import { KnexRentalRequestRepository } from '../rental-request/KnexRentalRequestRepository';
import { KnexRentalIssueRepository } from './KnexRentalIssueRepository';

const BARLA = { address: '12 rue Barla, 06300 Nice', box: 'B12' };

// Ce SUT, exclu du build, pose une vraie annonce et une vraie réservation
// payée et confirmée, par les vrais dépôts : une réclamation n'existe que sur
// elle.
export const createKnexRentalIssueRepositorySUT = () => {
  const connection = getTestDbConnection();
  const rentals = new KnexRentalRequestRepository(connection);
  const repository = new KnexRentalIssueRepository(connection);

  return {
    connection,
    repository,
    rentals,

    async givenConfirmedRental(): Promise<string> {
      await new KnexListingRepository(connection).create(
        new ListingBuilder()
          .withOwnerId('account-marc')
          .withAddress(BARLA.address)
          .withBox(BARLA.box)
          .withAvailability({
            from: new Date('2026-10-01T00:00:00.000Z'),
            to: new Date('2026-12-31T00:00:00.000Z'),
          })
          .build(),
      );
      const request = RentalRequest.request({
        renterId: 'account-lea',
        ...BARLA,
        days: { from: '2026-10-10', to: '2026-10-12' },
        pricing: { dayInCents: 1500, weekInCents: null, monthInCents: null },
        requestedAt: new Date('2026-10-01T07:00:00.000Z'),
        platformFeePercent: 15,
      });
      if (Either.isLeft(request)) throw new Error('arrange failed');
      await rentals.createRequest(request.right);
      await rentals.markHoldPlaced(
        request.right.id,
        'pi_lea',
        new Date('2026-10-01T07:05:00.000Z'),
      );
      await rentals.confirmRequest(
        request.right.id,
        new Date('2026-10-02T09:00:00.000Z'),
      );
      return request.right.id;
    },

    anIssueOn(
      requestId: string,
      reason: 'NO_ACCESS' | 'PLACE_OCCUPIED' = 'NO_ACCESS',
    ) {
      const issue = reportIssue({
        requestId,
        reason,
        message: 'Le portail ne s’ouvre pas',
        reportedAt: new Date('2026-10-10T08:00:00.000Z'),
      });
      if (Either.isLeft(issue)) throw new Error('arrange failed');
      return issue.right;
    },

    async givenTransferred(requestId: string) {
      await connection('owner_transfers').insert({
        rental_request_id: requestId,
        owner_id: 'account-marc',
        amount_in_cents: 3825,
        stripe_transfer_id: 'tr_lea',
        transferred_at: new Date('2026-10-10T22:05:00.000Z'),
      });
    },

    async givenResolvedAs(
      issueId: string,
      status: 'PARTIALLY_REFUNDED' | 'DISMISSED',
      refundInCents: number | null,
    ) {
      await connection('rental_issues')
        .where({ id: issueId })
        .update({
          status,
          refund_in_cents: refundInCents,
          resolved_at: new Date('2026-10-10T10:00:00.000Z'),
        });
    },
  };
};
