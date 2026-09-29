import { Either } from 'effect/index';
import * as request from 'supertest';

import { PLATFORM_SETTINGS_BOUNDS } from '../../../../../shared/platform-settings/domain/entities/PlatformSettings';
import { InvalidPlatformSettingsError } from '../../../../../shared/platform-settings/domain/errors/InvalidPlatformSettingsError';
import { createControllerTestApp } from '../../../../../shared/test/http/createControllerTestApp';
import {
  AdminActionKind,
  AdminTargetType,
} from '../../../../domain/entities/AdminAction';
import { MissingModerationReasonError } from '../../../../domain/errors/MissingModerationReasonError';
import { PlatformSettingsUnchangedError } from '../../../../domain/errors/PlatformSettingsUnchangedError';
import { InvalidRefundAmountError } from '../../../../domain/usecases/resolve-rental-issue/errors/InvalidRefundAmountError';
import { RentalIssueAlreadyResolvedError } from '../../../../domain/usecases/resolve-rental-issue/errors/RentalIssueAlreadyResolvedError';
import { createBackOfficeControllerSUT } from './back-office.controller.sut';

const ADMIN = 'account-admin';
const TERMS = {
  platformFeePercent: 12.5,
  freeCancellationHours: 48,
  requestExpiryHours: 24,
  payoutReleaseDelayHours: 72,
};
const REASON = 'Commission alignée sur le marché';

describe('BackOfficeController — settings and journal', () => {
  let sut: ReturnType<typeof createBackOfficeControllerSUT>;
  let testApp: Awaited<ReturnType<typeof createControllerTestApp>>;

  const http = () => request(testApp.app.getHttpServer());

  beforeEach(async () => {
    sut = createBackOfficeControllerSUT();
    testApp = await createControllerTestApp(sut.metadata, sut.authState);
  });

  afterEach(async () => {
    await testApp.close();
  });

  it('reads the settings in force and their bounds', async () => {
    sut.givenSignedInAdmin(ADMIN);
    sut.readSettings.willResolve(
      Either.right({ settings: TERMS, bounds: PLATFORM_SETTINGS_BOUNDS }),
    );

    const response = await http()
      .get('/admin/settings')
      .set('Authorization', 'Bearer token');

    expect(response.status).toEqual(200);
    expect(response.body).toEqual({
      settings: TERMS,
      bounds: {
        platformFeePercent: { min: 0, max: 50, decimals: 2 },
        freeCancellationHours: { min: 0, max: 336, decimals: 0 },
        requestExpiryHours: { min: 1, max: 96, decimals: 0 },
        payoutReleaseDelayHours: { min: 0, max: 720, decimals: 0 },
      },
    });
    expect(sut.readSettings.calls).toEqual([{ adminAccountId: ADMIN }]);
  });

  it('changes the settings with the reason, and answers 204', async () => {
    sut.givenSignedInAdmin(ADMIN);
    sut.changeSettings.willResolve(Either.right(undefined));

    const response = await http()
      .post('/admin/settings')
      .set('Authorization', 'Bearer token')
      .send({ ...TERMS, reason: REASON });

    expect(response.status).toEqual(204);
    expect(
      sut.changeSettings.calls.map(({ actedAt: _at, ...call }) => call),
    ).toEqual([{ adminAccountId: ADMIN, settings: TERMS, reason: REASON }]);
  });

  it('answers 400 with the path of the missing field, without calling the use case', async () => {
    sut.givenSignedInAdmin(ADMIN);

    const { requestExpiryHours: _missing, ...incomplete } = TERMS;
    const response = await http()
      .post('/admin/settings')
      .set('Authorization', 'Bearer token')
      .send({ ...incomplete, reason: REASON });

    expect(response.status).toEqual(400);
    expect(response.body.message).toEqual('requestExpiryHours: is missing');
    expect(sut.changeSettings.calls).toEqual([]);
  });

  it.each([
    [
      new InvalidPlatformSettingsError('requestExpiryHours', {
        min: 1,
        max: 96,
      }),
      'Le délai de réponse du loueur doit être un nombre entier d’heures, entre 1 et 96',
    ],
    [
      new MissingModerationReasonError(),
      'Une action de modération exige un motif d’au moins 10 caractères',
    ],
    [
      new PlatformSettingsUnchangedError(),
      'Aucun réglage n’a changé : il n’y a rien à enregistrer',
    ],
  ])('answers 400 with the message of %s', async (error, message) => {
    sut.givenSignedInAdmin(ADMIN);
    sut.changeSettings.willResolve(Either.left(error));

    const response = await http()
      .post('/admin/settings')
      .set('Authorization', 'Bearer token')
      .send({ ...TERMS, reason: REASON });

    expect({ status: response.status, message: response.body.message }).toEqual(
      { status: 400, message },
    );
  });

  it('refuses a signed-in account that does not administer the site', async () => {
    sut.givenSignedInAs('account-lea');

    const response = await http()
      .post('/admin/settings')
      .set('Authorization', 'Bearer token')
      .send({ ...TERMS, reason: REASON });

    expect(response.status).toEqual(403);
    expect(sut.changeSettings.calls).toEqual([]);
  });

  it('reads the journal with its dates in ISO form', async () => {
    sut.givenSignedInAdmin(ADMIN);
    sut.readJournal.willResolve(
      Either.right([
        {
          id: 'log-1',
          actedAt: new Date('2026-10-02T10:00:00.000Z'),
          adminEmail: 'admin@bookparking.fr',
          kind: AdminActionKind.CHANGE_PLATFORM_SETTINGS,
          targetType: AdminTargetType.PLATFORM_SETTINGS,
          targetId: 'version-2',
          targetLabel: null,
          reason: REASON,
          settingsChange: { before: null, after: TERMS },
        },
      ]),
    );

    const response = await http()
      .get('/admin/journal')
      .set('Authorization', 'Bearer token');

    expect(response.status).toEqual(200);
    expect(response.body).toEqual([
      {
        id: 'log-1',
        actedAt: '2026-10-02T10:00:00.000Z',
        adminEmail: 'admin@bookparking.fr',
        kind: 'CHANGE_PLATFORM_SETTINGS',
        targetType: 'PLATFORM_SETTINGS',
        targetId: 'version-2',
        targetLabel: null,
        reason: REASON,
        settingsChange: { before: null, after: TERMS },
      },
    ]);
  });

  describe('POST /admin/issues/:id/resolution', () => {
    const ISSUE_ID = '6f1c2d3e-4a5b-4c6d-8e7f-9a0b1c2d3e4f';

    it('passes the decision, the amount and the reason, and answers 204', async () => {
      sut.givenSignedInAdmin(ADMIN);
      sut.resolveIssue.willResolve(Either.right(undefined));

      const response = await http()
        .post(`/admin/issues/${ISSUE_ID}/resolution`)
        .set('Authorization', 'Bearer token')
        .send({
          decision: 'PARTIAL_REFUND',
          refundInCents: 1500,
          reason: 'Place occupée une demi-journée',
        });

      expect(response.status).toEqual(204);
      expect(
        sut.resolveIssue.calls.map(({ actedAt: _at, ...call }) => call),
      ).toEqual([
        {
          adminAccountId: ADMIN,
          issueId: ISSUE_ID,
          decision: 'PARTIAL_REFUND',
          refundInCents: 1500,
          reason: 'Place occupée une demi-journée',
        },
      ]);
    });

    it.each([
      [
        new InvalidRefundAmountError(3824),
        400,
        'Un remboursement partiel va de 0,01 € à 38,24 €, pris sur la part du loueur',
      ],
      [
        new RentalIssueAlreadyResolvedError(),
        409,
        'Cette réclamation a déjà été tranchée',
      ],
    ])('turns %s into %s', async (error, status, message) => {
      sut.givenSignedInAdmin(ADMIN);
      sut.resolveIssue.willResolve(Either.left(error));

      const response = await http()
        .post(`/admin/issues/${ISSUE_ID}/resolution`)
        .set('Authorization', 'Bearer token')
        .send({ decision: 'DISMISS', reason: 'Le conducteur est entré' });

      expect({
        status: response.status,
        message: response.body.message,
      }).toEqual({ status, message });
    });

    it('answers 400 on an unknown decision, without calling the use case', async () => {
      sut.givenSignedInAdmin(ADMIN);

      const response = await http()
        .post(`/admin/issues/${ISSUE_ID}/resolution`)
        .set('Authorization', 'Bearer token')
        .send({ decision: 'IGNORE', reason: 'Le conducteur est entré' });

      expect(response.status).toEqual(400);
      expect(sut.resolveIssue.calls).toEqual([]);
    });
  });
});
