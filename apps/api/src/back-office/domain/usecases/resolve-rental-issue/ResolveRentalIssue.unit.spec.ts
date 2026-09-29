import { Either } from 'effect/index';

import {
  AdminActionKind,
  AdminTargetType,
} from '../../../domain/entities/AdminAction';
import { createResolveRentalIssueSUT, REQUEST } from './ResolveRentalIssue.sut';

const AT = new Date('2026-10-10T10:00:00.000Z');
const REASON = 'Photo de la place occupée reçue';
const NOTHING_WRITTEN = { resolutions: [], cancelled: [], actions: [] };
const BOTH_PARTIES_TOLD = [
  {
    kind: 'RENTAL_ISSUE_RESOLVED',
    recipientId: 'account-lea',
    requestId: REQUEST,
  },
  {
    kind: 'RENTAL_ISSUE_RESOLVED',
    recipientId: 'account-marc',
    requestId: REQUEST,
  },
];
const journalLine = {
  adminAccountId: 'account-admin',
  kind: AdminActionKind.RESOLVE_RENTAL_ISSUE,
  targetType: AdminTargetType.RENTAL_REQUEST,
  targetId: REQUEST,
  reason: REASON,
  actedAt: AT,
};
const resolved = {
  resolvedAt: AT,
  resolvedBy: 'account-admin',
  reason: REASON,
};

describe('ResolveRentalIssue', () => {
  it('refunds everything by cancelling the rental, writes the journal and tells both parties', async () => {
    const sut = createResolveRentalIssueSUT();

    const result = await sut.whenResolving({ decision: 'REFUND' });

    expect(result).toEqual(Either.right(undefined));
    sut.thenWritten({
      resolutions: [{ ...resolved, status: 'REFUNDED', refundInCents: 4500 }],
      cancelled: [REQUEST],
      actions: [journalLine],
    });
    sut.thenNotificationsAre(BOTH_PARTIES_TOLD);
  });

  it('refunds a part taken from the owner share, without cancelling', async () => {
    const sut = createResolveRentalIssueSUT();

    await sut.whenResolving({
      decision: 'PARTIAL_REFUND',
      refundInCents: 1500,
    });

    sut.thenWritten({
      resolutions: [
        { ...resolved, status: 'PARTIALLY_REFUNDED', refundInCents: 1500 },
      ],
      cancelled: [],
      actions: [journalLine],
    });
  });

  it('dismisses the report, which releases the money to the owner', async () => {
    const sut = createResolveRentalIssueSUT();

    await sut.whenResolving({ decision: 'DISMISS' });

    sut.thenWritten({
      resolutions: [{ ...resolved, status: 'DISMISSED', refundInCents: null }],
      cancelled: [],
      actions: [journalLine],
    });
    sut.thenNotificationsAre(BOTH_PARTIES_TOLD);
  });

  it.each([[0], [3825], [12.5], [null]])(
    'refuses a partial refund of %s, outside one cent to the owner share less one cent',
    async (amount) => {
      const sut = createResolveRentalIssueSUT();

      const result = await sut.whenResolving({
        decision: 'PARTIAL_REFUND',
        refundInCents: amount,
      });

      sut.thenRefusedWith(result, {
        name: 'InvalidRefundAmountError',
        message:
          'Un remboursement partiel va de 0,01 € à 38,24 €, pris sur la part du loueur',
      });
      sut.thenWritten(NOTHING_WRITTEN);
    },
  );

  it('accepts a partial refund of the owner share less one cent', async () => {
    const sut = createResolveRentalIssueSUT();

    const result = await sut.whenResolving({
      decision: 'PARTIAL_REFUND',
      refundInCents: 3824,
    });

    expect(result).toEqual(Either.right(undefined));
  });

  it('refuses an account that does not administer the site', async () => {
    const sut = createResolveRentalIssueSUT();

    const result = await sut.whenResolving({
      by: 'account-lea',
      decision: 'REFUND',
    });

    sut.thenRefusedWith(result, {
      name: 'NotABackOfficeAdminError',
      message: "Cette action est réservée à l'administration du site",
    });
    sut.thenWritten(NOTHING_WRITTEN);
  });

  it('refuses a decision without a readable reason', async () => {
    const sut = createResolveRentalIssueSUT();

    const result = await sut.whenResolving({
      decision: 'DISMISS',
      reason: 'non',
    });

    sut.thenRefusedWith(result, {
      name: 'MissingModerationReasonError',
      message:
        'Une action de modération exige un motif d’au moins 10 caractères',
    });
  });

  it('refuses to decide twice', async () => {
    const sut = createResolveRentalIssueSUT();
    sut.givenIssueAlreadyResolved();

    const result = await sut.whenResolving({ decision: 'REFUND' });

    sut.thenRefusedWith(result, {
      name: 'RentalIssueAlreadyResolvedError',
      message: 'Cette réclamation a déjà été tranchée',
    });
    sut.thenNotificationsAre([]);
  });

  it('refuses an unknown report', async () => {
    const sut = createResolveRentalIssueSUT();
    sut.givenNoIssue();

    const result = await sut.whenResolving({ decision: 'DISMISS' });

    sut.thenRefusedWith(result, {
      name: 'ModerationTargetNotFoundError',
      message: "La cible de cette action n'existe pas",
    });
  });

  it('refuses a full refund of a rental already cancelled, and tells nobody', async () => {
    const sut = createResolveRentalIssueSUT();
    sut.givenRentalAlreadyCancelled();

    const result = await sut.whenResolving({ decision: 'REFUND' });

    sut.thenRefusedWith(result, {
      name: 'RentalNoLongerRefundableError',
      message:
        'Cette réservation a déjà été annulée : elle ne peut plus être remboursée en totalité',
    });
    sut.thenNotificationsAre([]);
  });
});
