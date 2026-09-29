import { Either } from 'effect/index';
import knex, { Knex } from 'knex';

import { KnexListingRepository } from '../../../../listing/adapters/repositories/listing/KnexListingRepository';
import { SchemaListingRepository } from '../../../../listing/adapters/repositories/listing/SchemaListingRepository';
import { ListingBuilder } from '../../../../listing/domain/builders/ListingBuilder';
import { ListingStatus } from '../../../../listing/domain/entities/Listing';
import { UnpublishListing } from '../../../../listing/domain/usecases/unpublish-listing/UnpublishListing';
import { getTestDbConnection } from '../../../../infra/testcontainers-setup';
import { buildTestKnexConfig } from '../../../../infra/testKnexfile';
import {
  CalendarDay,
  PARIS_TIME_ZONE,
  zonedTimeToUtc,
} from '../../../domain/entities/CalendarDay';
import { placeKeyOf, RentalPlace } from '../../../domain/entities/RentalPlace';
import { ConfirmRentalRequest } from '../../../domain/usecases/confirm-rental-request/ConfirmRentalRequest';
import { RequestRental } from '../../../domain/usecases/request-rental/RequestRental';
import { DatesAlreadyRentedError } from '../../../domain/usecases/request-rental/errors/DatesAlreadyRentedError';
import { KnexPublishedListingReader } from '../published-listing/KnexPublishedListingReader';
import { KnexRentalRequestRepository } from './KnexRentalRequestRepository';
import { SchemaRentalRequestRepository } from './SchemaRentalRequestRepository';

type RequestOutcome = Awaited<ReturnType<RequestRental['execute']>>;
type UnpublicationOutcome = Awaited<ReturnType<UnpublishListing['execute']>>;

interface RequestInput extends RentalPlace {
  renter: string;
  from: CalendarDay;
  to: CalendarDay;
}

interface UnpublicationInput extends RentalPlace {
  owner: string;
}

interface RequestedPeriodInput extends RentalPlace {
  from: CalendarDay;
  to: CalendarDay;
}

const CONCURRENT_CONNECTION_COUNT = 4;
const BLOCKED_REQUEST_TIMEOUT_IN_MS = 10000;
const BLOCKED_REQUEST_POLL_IN_MS = 25;

// buildTestKnexConfig pins pool max to 1, so the shared test connection runs
// every query on a single backend: two transactions opened on it would wait for
// each other in the pool instead of in Postgres, and the concurrency the two
// examples describe could never happen. Both when* helpers below therefore own
// a second pool against the same container, destroyed before they return.
const createConcurrentConnection = (): Knex => {
  const sharedConfig = getTestDbConnection().client.config as Knex.Config;
  return knex({
    ...buildTestKnexConfig(
      sharedConfig.connection as Parameters<typeof buildTestKnexConfig>[0],
    ),
    pool: { min: 0, max: CONCURRENT_CONNECTION_COUNT },
  });
};

const waitForRequestBlockedOnListingRow = async (
  connection: Knex,
): Promise<void> => {
  const deadline = Date.now() + BLOCKED_REQUEST_TIMEOUT_IN_MS;

  while (Date.now() < deadline) {
    const { rows } = await connection.raw<{ rows: { blocked: string }[] }>(
      `SELECT count(*) AS blocked
         FROM pg_stat_activity
        WHERE datname = current_database()
          AND wait_event_type = 'Lock'
          AND query ILIKE '%for update%'`,
    );
    if (Number(rows[0].blocked) > 0) return;

    await new Promise((resolve) =>
      setTimeout(resolve, BLOCKED_REQUEST_POLL_IN_MS),
    );
  }

  throw new Error(
    'The rental request never waited on the listing row lock: the interleaving was not driven, only observed.',
  );
};

export const createKnexRentalRequestRepositorySUT = () => {
  const testDbConnection = getTestDbConnection();

  const testConstants = {
    ownerNameForTest: 'Marc D.',
    ownerIdForTest: 'account-marc',
    renterNameForTest: 'Léa T.',
    renterIdForTest: 'account-lea',
    otherRenterNameForTest: 'Karim B.',
    otherRenterIdForTest: 'account-karim',
    simultaneousRequestInstant: '2026-10-20T18:30:00.000',
    racingRequestInstant: '2026-10-10T14:00:00.000',
    confirmationInstant: new Date('2026-10-11T09:00:00.000Z'),
    requestExpiryInHoursForTest: 48,
    availableFrom: new Date('2026-10-01T00:00:00.000Z'),
    availableTo: new Date('2026-12-31T00:00:00.000Z'),
  };

  const accountIdsByPersonName: Record<string, string> = {
    [testConstants.ownerNameForTest]: testConstants.ownerIdForTest,
    [testConstants.renterNameForTest]: testConstants.renterIdForTest,
    [testConstants.otherRenterNameForTest]: testConstants.otherRenterIdForTest,
  };

  const toAccountId = (personName: string): string =>
    accountIdsByPersonName[personName] ?? `account-${personName}`;

  const parisInstant = (wallClock: string): Date =>
    zonedTimeToUtc(wallClock, PARIS_TIME_ZONE);

  const context = {
    testDbConnection,
    testConstants,
  };

  const executeRequest = (
    connection: Knex,
    input: RequestInput,
    requestedAt: Date,
  ): Promise<RequestOutcome> =>
    new RequestRental(
      new KnexPublishedListingReader(connection),
      new KnexRentalRequestRepository(connection),
      testConstants.requestExpiryInHoursForTest,
    ).execute({
      renterId: toAccountId(input.renter),
      address: input.address,
      box: input.box,
      fromDay: input.from,
      toDay: input.to,
      requestedAt,
    });

  return {
    context,

    async givenActiveListing(input: { owner: string } & RentalPlace) {
      const listing = new ListingBuilder()
        .withOwnerId(toAccountId(input.owner))
        .withAddress(input.address)
        .withBox(input.box)
        .withAvailability({
          from: testConstants.availableFrom,
          to: testConstants.availableTo,
        })
        .build();

      await new KnexListingRepository(context.testDbConnection).create(listing);
      return { listing };
    },

    async whenBothRequestAtOnce(
      first: RequestInput,
      second: RequestInput,
    ): Promise<RequestOutcome[]> {
      const connection = createConcurrentConnection();
      const requestedAt = parisInstant(
        testConstants.simultaneousRequestInstant,
      );
      try {
        return await Promise.all([
          executeRequest(connection, first, requestedAt),
          executeRequest(connection, second, requestedAt),
        ]);
      } finally {
        await connection.destroy();
      }
    },

    // The two collide in one order only because the test puts them in it: the
    // unpublication updates the listing row inside a transaction left open, the
    // request then reads that same row still ACTIVE through MVCC, and parks on
    // the FOR UPDATE its own write takes. Committing the unpublication only once
    // the request is measurably parked is what removes the scheduling luck —
    // the database, not the ordering, is what then refuses the row.
    async whenRequestingWhileUnpublishing(
      request: RequestInput,
      unpublication: UnpublicationInput,
    ): Promise<{
      request: RequestOutcome;
      unpublication: UnpublicationOutcome;
    }> {
      const connection = createConcurrentConnection();
      const unpublishingTransaction = await connection.transaction();

      try {
        const unpublicationOutcome = await new UnpublishListing(
          new KnexListingRepository(unpublishingTransaction),
        ).execute({
          ownerId: toAccountId(unpublication.owner),
          address: unpublication.address,
          box: unpublication.box,
        });

        const requesting = executeRequest(
          connection,
          request,
          parisInstant(testConstants.racingRequestInstant),
        );

        try {
          await waitForRequestBlockedOnListingRow(connection);
        } finally {
          await unpublishingTransaction.commit();
        }

        return {
          request: await requesting,
          unpublication: unpublicationOutcome,
        };
      } finally {
        await connection.destroy();
      }
    },

    async whenRequesting(input: RequestInput): Promise<RequestOutcome> {
      return executeRequest(
        context.testDbConnection,
        input,
        parisInstant(testConstants.racingRequestInstant),
      );
    },

    async whenRequestingAt(
      input: RequestInput,
      requestedAt: Date,
    ): Promise<RequestOutcome> {
      return executeRequest(context.testDbConnection, input, requestedAt);
    },

    async whenConfirming(input: { requestId: string; owner: string }) {
      return new ConfirmRentalRequest(
        new KnexRentalRequestRepository(context.testDbConnection),
      ).execute({
        requestId: input.requestId,
        ownerId: toAccountId(input.owner),
        confirmedAt: testConstants.confirmationInstant,
      });
    },

    async whenReadingSummaryOf(requestId: string) {
      return new KnexRentalRequestRepository(
        context.testDbConnection,
      ).findRequestSummary(requestId);
    },

    async whenReadingConfirmedRentalsFor(place: RentalPlace) {
      return new KnexRentalRequestRepository(
        context.testDbConnection,
      ).findConfirmedByPlace(place);
    },

    async thenStoredRequestRowIs(
      requestId: string,
      expected: { status: string; confirmedAt: Date | null },
    ) {
      const rows = await context
        .testDbConnection<SchemaRentalRequestRepository>('rental_requests')
        .where({ id: requestId });

      expect(rows).toHaveLength(1);
      expect(rows[0].status).toEqual(expected.status);
      if (expected.confirmedAt === null) {
        expect(rows[0].confirmed_at).toEqual(null);
        return;
      }
      expect(new Date(rows[0].confirmed_at as string | Date)).toEqual(
        expected.confirmedAt,
      );
    },

    async thenExactlyOneRequestRowExistsFor(period: RequestedPeriodInput) {
      const rows = await context
        .testDbConnection<SchemaRentalRequestRepository>('rental_requests')
        .where({
          place_key: placeKeyOf({ address: period.address, box: period.box }),
          from_day: period.from,
          to_day: period.to,
        });

      expect(rows).toHaveLength(1);
    },

    thenExactlyOneOutcomeIsRefusedForUnavailableDates(
      outcomes: RequestOutcome[],
    ) {
      const refusals = outcomes
        .filter(Either.isLeft)
        .map((outcome) => outcome.left);

      expect(refusals).toHaveLength(1);
      expect(refusals[0]).toBeInstanceOf(DatesAlreadyRentedError);
    },

    thenRequestIsRefused(outcomes: { request: RequestOutcome }) {
      expect(Either.isLeft(outcomes.request)).toEqual(true);
    },

    thenUnpublicationSucceeded(outcomes: {
      unpublication: UnpublicationOutcome;
    }) {
      expect(Either.isRight(outcomes.unpublication)).toEqual(true);
    },

    async thenStoredListingIsUnpublished(place: RentalPlace) {
      const rows = await context
        .testDbConnection<SchemaListingRepository>('listings')
        .where({ place_key: placeKeyOf(place) });

      expect(rows).toHaveLength(1);
      expect(rows[0].status).toEqual(ListingStatus.UNPUBLISHED);
    },

    async thenNoRequestRowExistsFor(period: RequestedPeriodInput) {
      const rows = await context
        .testDbConnection<SchemaRentalRequestRepository>('rental_requests')
        .where({
          place_key: placeKeyOf({ address: period.address, box: period.box }),
        });

      expect(rows).toEqual([]);
    },
  };
};
