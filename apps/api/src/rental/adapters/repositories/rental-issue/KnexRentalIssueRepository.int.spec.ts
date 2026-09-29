import {
  cleanDatabase,
  startTestDatabase,
  stopTestDatabase,
} from '../../../../infra/testcontainers-setup';
import { createKnexRentalIssueRepositorySUT } from './KnexRentalIssueRepository.sut';

const REPORTED_AT = new Date('2026-10-10T08:00:00.000Z');

describe('KnexRentalIssueRepository', () => {
  beforeAll(async () => {
    await startTestDatabase();
  }, 120000);

  afterEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await stopTestDatabase();
  });

  it('reads the facts a report needs, then the report written on the rental', async () => {
    const sut = createKnexRentalIssueRepositorySUT();
    const requestId = await sut.givenConfirmedRental();
    const before = await sut.repository.findContext(requestId);
    const issue = sut.anIssueOn(requestId);

    const created = await sut.repository.create(issue);
    const after = await sut.repository.findContext(requestId);

    expect(before).toEqual({
      requestId,
      renterId: 'account-lea',
      ownerId: 'account-marc',
      status: 'CONFIRMED',
      money: 'CAPTURED',
      startsAt: new Date('2026-10-09T22:00:00.000Z'),
      endsAt: new Date('2026-10-12T21:59:59.999Z'),
      arrivedAt: null,
      transferred: false,
      hasIssue: false,
      issue: null,
    });
    expect(created).toBe(true);
    expect(after).toEqual({ ...before, hasIssue: true, issue });
  });

  it('keeps one report per rental, however many arrive', async () => {
    const sut = createKnexRentalIssueRepositorySUT();
    const requestId = await sut.givenConfirmedRental();

    const first = await sut.repository.create(sut.anIssueOn(requestId));
    const second = await sut.repository.create(
      sut.anIssueOn(requestId, 'PLACE_OCCUPIED'),
    );

    expect([first, second]).toEqual([true, false]);
    expect(
      (await sut.repository.findContext(requestId))?.issue?.reason,
    ).toEqual('NO_ACCESS');
  });

  it('knows when the money already went to the owner', async () => {
    const sut = createKnexRentalIssueRepositorySUT();
    const requestId = await sut.givenConfirmedRental();
    await sut.givenTransferred(requestId);

    expect((await sut.repository.findContext(requestId))?.transferred).toBe(
      true,
    );
  });

  it('records the answer of the owner once, and only on an open report', async () => {
    const sut = createKnexRentalIssueRepositorySUT();
    const requestId = await sut.givenConfirmedRental();
    const issue = sut.anIssueOn(requestId);
    await sut.repository.create(issue);
    const at = new Date('2026-10-10T08:30:00.000Z');

    const first = await sut.repository.recordOwnerReply(
      issue.id,
      'Code 4821B.',
      at,
    );
    const second = await sut.repository.recordOwnerReply(
      issue.id,
      'Encore',
      at,
    );

    expect([first, second]).toEqual([true, false]);
    expect((await sut.repository.findContext(requestId))?.issue).toEqual({
      ...issue,
      ownerReply: 'Code 4821B.',
      ownerRepliedAt: at,
    });
  });

  it('owes a partial refund until Stripe gives its identifier', async () => {
    const sut = createKnexRentalIssueRepositorySUT();
    const requestId = await sut.givenConfirmedRental();
    const refunded = sut.anIssueOn(requestId);
    await sut.repository.create(refunded);
    await sut.givenResolvedAs(refunded.id, 'PARTIALLY_REFUNDED', 1500);

    const due = await sut.repository.findRefundsDue();
    await sut.repository.markRefunded(refunded.id, 're_lea');

    expect(due).toEqual([
      {
        issueId: refunded.id,
        requestId,
        paymentId: 'pi_lea',
        amountInCents: 1500,
      },
    ]);
    expect(await sut.repository.findRefundsDue()).toEqual([]);
  });

  it('shows the report on the rental the driver and the owner list', async () => {
    const sut = createKnexRentalIssueRepositorySUT();
    const requestId = await sut.givenConfirmedRental();
    const issue = sut.anIssueOn(requestId);
    await sut.repository.create(issue);

    const [asRenter] = await sut.rentals.findAllByRenter('account-lea');
    const [asOwner] = await sut.rentals.findAllForOwner('account-marc');

    expect([asRenter.issue, asRenter.transferred]).toEqual([issue, false]);
    expect(asOwner.issue).toEqual({ ...issue, reportedAt: REPORTED_AT });
  });
});
