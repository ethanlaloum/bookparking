import { ModuleMetadata } from '@nestjs/common';
import { Either } from 'effect/index';

import { PlatformSettings } from '../../../../../shared/platform-settings/domain/entities/PlatformSettings';
import { TestAuthState } from '../../../../../shared/test/http/TestAuthGuard';
import { UseCaseDouble } from '../../../../../shared/test/http/UseCaseDouble';
import { AdminJournalEntry } from '../../../../domain/ports/BackOfficeRepository';
import { CancelRentalRequest } from '../../../../domain/usecases/cancel-rental-request/CancelRentalRequest';
import { ChangePlatformSettings } from '../../../../domain/usecases/change-platform-settings/ChangePlatformSettings';
import { ListRentalIssues } from '../../../../domain/usecases/list-rental-issues/ListRentalIssues';
import { ResolveRentalIssue } from '../../../../domain/usecases/resolve-rental-issue/ResolveRentalIssue';
import { LiftAccountSuspension } from '../../../../domain/usecases/lift-account-suspension/LiftAccountSuspension';
import { ListAccounts } from '../../../../domain/usecases/list-accounts/ListAccounts';
import { ListAllListings } from '../../../../domain/usecases/list-listings/ListAllListings';
import { ListAllRentalRequests } from '../../../../domain/usecases/list-rental-requests/ListAllRentalRequests';
import { ReadAdminJournal } from '../../../../domain/usecases/read-admin-journal/ReadAdminJournal';
import { ReadOverview } from '../../../../domain/usecases/read-overview/ReadOverview';
import {
  PlatformSettingsForm,
  ReadPlatformSettings,
} from '../../../../domain/usecases/read-platform-settings/ReadPlatformSettings';
import { SuspendAccount } from '../../../../domain/usecases/suspend-account/SuspendAccount';
import { UnpublishAnyListing } from '../../../../domain/usecases/unpublish-any-listing/UnpublishAnyListing';
import { BackOfficeController } from './back-office.controller';

// `AdminGuard` reste le vrai : il ne lit qu'une méthode du dépôt, que ce faux
// tient. Les cas d'usage des routes que ces tests ne visent pas restent muets.
export const createBackOfficeControllerSUT = () => {
  const admins = new Set<string>();
  const readSettings = new UseCaseDouble<
    { adminAccountId: string },
    Either.Either<PlatformSettingsForm, Error>
  >();
  const changeSettings = new UseCaseDouble<
    {
      adminAccountId: string;
      settings: PlatformSettings;
      reason: string;
      actedAt: Date;
    },
    Either.Either<void, Error>
  >();
  const readJournal = new UseCaseDouble<
    { adminAccountId: string },
    Either.Either<AdminJournalEntry[], Error>
  >();
  const resolveIssue = new UseCaseDouble<
    {
      adminAccountId: string;
      issueId: string;
      decision: string;
      refundInCents: number | null;
      reason: string;
      actedAt: Date;
    },
    Either.Either<void, Error>
  >();
  const authState: TestAuthState = { user: null };
  const silent = () => new UseCaseDouble();

  const metadata: ModuleMetadata = {
    controllers: [BackOfficeController],
    providers: [
      {
        provide: 'BackOfficeRepository',
        useValue: { isAdmin: async (id: string) => admins.has(id) },
      },
      { provide: ReadOverview, useValue: silent() },
      { provide: ListAccounts, useValue: silent() },
      { provide: ListAllListings, useValue: silent() },
      { provide: ListAllRentalRequests, useValue: silent() },
      { provide: UnpublishAnyListing, useValue: silent() },
      { provide: SuspendAccount, useValue: silent() },
      { provide: LiftAccountSuspension, useValue: silent() },
      { provide: CancelRentalRequest, useValue: silent() },
      { provide: ReadPlatformSettings, useValue: readSettings },
      { provide: ChangePlatformSettings, useValue: changeSettings },
      { provide: ReadAdminJournal, useValue: readJournal },
      { provide: ListRentalIssues, useValue: silent() },
      { provide: ResolveRentalIssue, useValue: resolveIssue },
    ],
  };

  return {
    metadata,
    authState,
    readSettings,
    changeSettings,
    readJournal,
    resolveIssue,

    givenSignedInAdmin(accountId: string) {
      admins.add(accountId);
      authState.user = { id: accountId };
    },

    givenSignedInAs(accountId: string) {
      authState.user = { id: accountId };
    },
  };
};
