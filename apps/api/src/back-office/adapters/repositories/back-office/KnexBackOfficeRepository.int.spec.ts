import {
  cleanDatabase,
  startTestDatabase,
  stopTestDatabase,
} from '../../../../infra/testcontainers-setup';
import { DEFAULT_PLATFORM_SETTINGS } from '../../../../shared/platform-settings/domain/entities/PlatformSettings';
import {
  AdminActionKind,
  AdminTargetType,
} from '../../../domain/entities/AdminAction';
import { createKnexBackOfficeRepositorySUT } from './KnexBackOfficeRepository.sut';

const LEA_AND_MARC = { renterId: 'account-lea', ownerId: 'account-marc' };

describe('KnexBackOfficeRepository @SPEC-004', () => {
  beforeAll(async () => {
    await startTestDatabase();
  }, 120000);

  afterEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await stopTestDatabase();
  });

  it('owes the renter a full refund when a confirmed request is cancelled @EX-004-30', async () => {
    const sut = createKnexBackOfficeRepositorySUT();
    const requestId = await sut.givenLeaRequestConfirmedAndCaptured();

    const cancelled = await sut.whenTheOperatorCancels(requestId);

    expect(cancelled).toEqual(LEA_AND_MARC);
    await sut.thenStoredRowIs(requestId, {
      status: 'CANCELLED',
      money: 'REFUND_DUE',
    });
  });

  it('owes the renter a release when a request awaiting the owner is cancelled @EX-004-31', async () => {
    const sut = createKnexBackOfficeRepositorySUT();
    const requestId = await sut.givenLeaRequestWithHoldPlaced();

    const cancelled = await sut.whenTheOperatorCancels(requestId);

    expect(cancelled).toEqual(LEA_AND_MARC);
    await sut.thenStoredRowIs(requestId, {
      status: 'CANCELLED',
      money: 'RELEASE_DUE',
    });
  });

  it('owes nothing when a request made before payments is cancelled @EX-004-32', async () => {
    const sut = createKnexBackOfficeRepositorySUT();
    const requestId = await sut.givenLeaRequestConfirmedBeforePayments();

    const cancelled = await sut.whenTheOperatorCancels(requestId);

    expect(cancelled).toEqual(LEA_AND_MARC);
    await sut.thenStoredRowIs(requestId, {
      status: 'CANCELLED',
      money: 'NONE',
    });
  });

  it('cancels nothing, and names no one, when the request is already cancelled', async () => {
    const sut = createKnexBackOfficeRepositorySUT();
    const requestId = await sut.givenLeaRequestWithHoldPlaced();
    await sut.whenTheOperatorCancels(requestId);

    const again = await sut.whenTheOperatorCancels(requestId);

    expect(again).toBeNull();
  });

  describe('platform settings and the journal', () => {
    const NEW_TERMS = {
      platformFeePercent: 12.5,
      freeCancellationHours: 48,
      requestExpiryHours: 24,
      payoutReleaseDelayHours: 72,
    };

    it('applies the defaults until a version exists, then the latest one', async () => {
      const sut = createKnexBackOfficeRepositorySUT();
      const admin = await sut.givenAccount('admin@bookparking.fr');
      const before = await sut.settingsReader.current();

      await sut.repository.savePlatformSettings(NEW_TERMS, {
        adminAccountId: admin,
        reason: 'Commission alignée sur le marché',
        at: new Date('2026-10-02T10:00:00.000Z'),
      });

      expect(before).toEqual(DEFAULT_PLATFORM_SETTINGS);
      expect(await sut.settingsReader.current()).toEqual(NEW_TERMS);
    });

    it('names every target and shows what a settings change replaced, most recent first', async () => {
      const sut = createKnexBackOfficeRepositorySUT();
      const admin = await sut.givenAccount('admin@bookparking.fr');
      const lea = await sut.givenAccount('lea@example.com');
      const requestId = await sut.givenLeaRequestWithHoldPlaced();
      const listingId = await sut.theListingId();
      const first = {
        adminAccountId: admin,
        reason: 'Valeurs de lancement',
        at: new Date('2026-10-01T00:00:00.000Z'),
      };
      await sut.repository.savePlatformSettings(
        DEFAULT_PLATFORM_SETTINGS,
        first,
      );
      const act = (
        kind: AdminActionKind,
        targetType: AdminTargetType,
        targetId: string,
        reason: string,
        at: string,
      ) =>
        sut.repository.recordAction({
          adminAccountId: admin,
          kind,
          targetType,
          targetId,
          reason,
          actedAt: new Date(at),
        });
      await act(
        AdminActionKind.UNPUBLISH_LISTING,
        AdminTargetType.LISTING,
        listingId,
        'Annonce en doublon',
        '2026-10-02T08:00:00.000Z',
      );
      await act(
        AdminActionKind.SUSPEND_ACCOUNT,
        AdminTargetType.ACCOUNT,
        lea,
        'Paiements contestés',
        '2026-10-02T09:00:00.000Z',
      );
      await act(
        AdminActionKind.CANCEL_RENTAL_REQUEST,
        AdminTargetType.RENTAL_REQUEST,
        requestId,
        'Place inaccessible',
        '2026-10-02T09:30:00.000Z',
      );
      const version = await sut.repository.savePlatformSettings(NEW_TERMS, {
        adminAccountId: admin,
        reason: 'Commission alignée sur le marché',
        at: new Date('2026-10-02T10:00:00.000Z'),
      });
      await act(
        AdminActionKind.CHANGE_PLATFORM_SETTINGS,
        AdminTargetType.PLATFORM_SETTINGS,
        version,
        'Commission alignée sur le marché',
        '2026-10-02T10:00:00.000Z',
      );

      const journal = await sut.repository.findJournal(10);

      expect(journal.map(({ id: _id, ...entry }) => entry)).toEqual([
        {
          actedAt: new Date('2026-10-02T10:00:00.000Z'),
          adminEmail: 'admin@bookparking.fr',
          kind: 'CHANGE_PLATFORM_SETTINGS',
          targetType: 'PLATFORM_SETTINGS',
          targetId: version,
          targetLabel: null,
          reason: 'Commission alignée sur le marché',
          settingsChange: {
            before: DEFAULT_PLATFORM_SETTINGS,
            after: NEW_TERMS,
          },
        },
        {
          actedAt: new Date('2026-10-02T09:30:00.000Z'),
          adminEmail: 'admin@bookparking.fr',
          kind: 'CANCEL_RENTAL_REQUEST',
          targetType: 'RENTAL_REQUEST',
          targetId: requestId,
          targetLabel:
            '12 rue Barla, 06300 Nice · 12, du 10/10/2026 au 12/10/2026',
          reason: 'Place inaccessible',
          settingsChange: null,
        },
        {
          actedAt: new Date('2026-10-02T09:00:00.000Z'),
          adminEmail: 'admin@bookparking.fr',
          kind: 'SUSPEND_ACCOUNT',
          targetType: 'ACCOUNT',
          targetId: lea,
          targetLabel: 'lea@example.com',
          reason: 'Paiements contestés',
          settingsChange: null,
        },
        {
          actedAt: new Date('2026-10-02T08:00:00.000Z'),
          adminEmail: 'admin@bookparking.fr',
          kind: 'UNPUBLISH_LISTING',
          targetType: 'LISTING',
          targetId: listingId,
          targetLabel: '12 rue Barla, 06300 Nice · 12',
          reason: 'Annonce en doublon',
          settingsChange: null,
        },
      ]);
    });
  });

  describe('rental issues', () => {
    it('lists the open reports first, with both parties and what the owner would receive', async () => {
      const sut = createKnexBackOfficeRepositorySUT();
      const lea = await sut.givenAccount('lea@example.com');
      const marc = await sut.givenAccount('marc@example.com');
      const older = await sut.givenReportedRental(
        lea,
        marc,
        '2026-10-10T08:00:00.000Z',
      );
      const newer = await sut.givenReportedRental(
        lea,
        marc,
        '2026-10-11T08:00:00.000Z',
      );
      await sut.repository.resolveRentalIssue(newer.issueId, {
        status: 'DISMISSED',
        refundInCents: null,
        resolvedAt: new Date('2026-10-11T09:00:00.000Z'),
        resolvedBy: marc,
        reason: 'Le conducteur est finalement entré',
      });

      const issues = await sut.repository.findRentalIssues();

      expect(issues.map((issue) => [issue.id, issue.status])).toEqual([
        [older.issueId, 'OPEN'],
        [newer.issueId, 'DISMISSED'],
      ]);
      expect(issues[0]).toEqual({
        id: older.issueId,
        requestId: older.requestId,
        reason: 'PLACE_OCCUPIED',
        message: 'Une Clio grise est garée sur la place',
        reportedAt: new Date('2026-10-10T08:00:00.000Z'),
        status: 'OPEN',
        ownerReply: null,
        ownerRepliedAt: null,
        refundInCents: null,
        resolvedAt: null,
        resolutionReason: null,
        address: '12 rue Barla, 06300 Nice',
        box: 'B1',
        fromDay: '2026-10-10',
        toDay: '2026-10-12',
        priceInCents: 4500,
        ownerShareInCents: 3825,
        renterEmail: 'lea@example.com',
        ownerEmail: 'marc@example.com',
      });
    });

    it('decides a report once, and counts the open ones on the overview', async () => {
      const sut = createKnexBackOfficeRepositorySUT();
      const lea = await sut.givenAccount('lea@example.com');
      const marc = await sut.givenAccount('marc@example.com');
      const { issueId, requestId } = await sut.givenReportedRental(
        lea,
        marc,
        '2026-10-10T08:00:00.000Z',
      );
      const before = await sut.repository.attentionOverview(new Date());
      const decision = {
        status: 'PARTIALLY_REFUNDED' as const,
        refundInCents: 1500,
        resolvedAt: new Date('2026-10-10T10:00:00.000Z'),
        resolvedBy: marc,
        reason: 'Place occupée une demi-journée',
      };

      const first = await sut.repository.resolveRentalIssue(issueId, decision);
      const second = await sut.repository.resolveRentalIssue(issueId, {
        ...decision,
        status: 'DISMISSED',
        refundInCents: null,
      });

      expect([first, second]).toEqual([true, false]);
      expect(await sut.repository.findIssueToResolve(issueId)).toEqual({
        issueId,
        requestId,
        status: 'PARTIALLY_REFUNDED',
        priceInCents: 4500,
        ownerShareInCents: 3825,
        renterId: lea,
        ownerId: marc,
      });
      expect([
        before.openRentalIssues,
        (await sut.repository.attentionOverview(new Date())).openRentalIssues,
      ]).toEqual([1, 0]);
    });
  });
});
