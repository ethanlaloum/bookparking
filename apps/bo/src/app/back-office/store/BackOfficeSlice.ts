import { createReducer, isAnyOf } from '@reduxjs/toolkit';

import { initialCommonState, type CommonState } from '@front/store/CommonState';
import { logoutSucceeded } from '../../auth/domain/use-cases/sign-out/signOutEpic';
import type { AdminAccount } from '../domain/entities/AdminAccount';
import type { AdminJournalEntry } from '../domain/entities/AdminJournalEntry';
import type { AdminRentalIssue } from '../domain/entities/AdminRentalIssue';
import type { AdminListing } from '../domain/entities/AdminListing';
import type { AdminRentalRequest } from '../domain/entities/AdminRentalRequest';
import type { Overview } from '../domain/entities/Overview';
import type { PlatformSettingsForm } from '../domain/entities/PlatformSettings';
import type { Failure } from '../domain/ports/BackOfficeGateway';
import {
  cancelRentalRequestFailed,
  cancelRentalRequestRequested,
  cancelRentalRequestSucceeded,
} from '../domain/use-cases/cancel-rental-request/cancelRentalRequestEpic';
import {
  changePlatformSettingsFailed,
  changePlatformSettingsRequested,
  changePlatformSettingsSucceeded,
  resetChangePlatformSettings,
} from '../domain/use-cases/change-platform-settings/changePlatformSettingsEpic';
import {
  confirmAdminAccessFailed,
  confirmAdminAccessRequested,
  confirmAdminAccessSucceeded,
} from '../domain/use-cases/confirm-admin-access/confirmAdminAccessEpic';
import {
  liftAccountSuspensionFailed,
  liftAccountSuspensionRequested,
  liftAccountSuspensionSucceeded,
} from '../domain/use-cases/lift-account-suspension/liftAccountSuspensionEpic';
import {
  listAccountsFailed,
  listAccountsRequested,
  listAccountsSucceeded,
} from '../domain/use-cases/list-accounts/listAccountsEpic';
import {
  listListingsFailed,
  listListingsRequested,
  listListingsSucceeded,
} from '../domain/use-cases/list-listings/listListingsEpic';
import {
  listRentalRequestsFailed,
  listRentalRequestsRequested,
  listRentalRequestsSucceeded,
} from '../domain/use-cases/list-rental-requests/listRentalRequestsEpic';
import {
  listRentalIssuesFailed,
  listRentalIssuesRequested,
  listRentalIssuesSucceeded,
} from '../domain/use-cases/list-rental-issues/listRentalIssuesEpic';
import {
  resetResolveRentalIssue,
  resolveRentalIssueFailed,
  resolveRentalIssueRequested,
  resolveRentalIssueSucceeded,
} from '../domain/use-cases/resolve-rental-issue/resolveRentalIssueEpic';
import {
  readAdminJournalFailed,
  readAdminJournalRequested,
  readAdminJournalSucceeded,
} from '../domain/use-cases/read-admin-journal/readAdminJournalEpic';
import {
  readOverviewFailed,
  readOverviewRequested,
  readOverviewSucceeded,
} from '../domain/use-cases/read-overview/readOverviewEpic';
import {
  readPlatformSettingsFailed,
  readPlatformSettingsRequested,
  readPlatformSettingsSucceeded,
} from '../domain/use-cases/read-platform-settings/readPlatformSettingsEpic';
import {
  suspendAccountFailed,
  suspendAccountRequested,
  suspendAccountSucceeded,
} from '../domain/use-cases/suspend-account/suspendAccountEpic';
import {
  unpublishListingFailed,
  unpublishListingRequested,
  unpublishListingSucceeded,
} from '../domain/use-cases/unpublish-listing/unpublishListingEpic';
import { resetModerationState } from './resetModerationState';

// Les quatre actions de modération partagent une tranche d'état : trois
// matchers plutôt que douze `addCase` recopiés. `isAnyOf` les construit depuis
// les créateurs eux-mêmes, si bien qu'une action renommée casse la compilation
// là où une chaîne recopiée aurait laissé l'écran silencieux.
const isModerationRequested = isAnyOf(
  unpublishListingRequested,
  suspendAccountRequested,
  liftAccountSuspensionRequested,
  cancelRentalRequestRequested,
);

const isModerationSucceeded = isAnyOf(
  unpublishListingSucceeded,
  suspendAccountSucceeded,
  liftAccountSuspensionSucceeded,
  cancelRentalRequestSucceeded,
);

const isModerationFailed = isAnyOf(
  unpublishListingFailed,
  suspendAccountFailed,
  liftAccountSuspensionFailed,
  cancelRentalRequestFailed,
);

/**
 * `unknown` tant qu'aucune lecture n'a abouti : c'est l'état d'un écran qui
 * charge, et la garde de route attend plutôt que de refuser. Une seule chose
 * fait basculer en `denied` — un 403 de l'api — parce que rien d'autre ne sait
 * si un compte administre le site.
 */
export type AdminAccess = 'unknown' | 'granted' | 'denied';

export interface BackOfficeState {
  overview: Overview | null;
  accounts: AdminAccount[];
  listings: AdminListing[];
  rentalRequests: AdminRentalRequest[];
  confirmAccess: CommonState;
  readOverview: CommonState;
  listAccounts: CommonState;
  listListings: CommonState;
  listRentalRequests: CommonState;
  // Une seule tranche pour les quatre actions : l'écran n'en ouvre qu'une à la
  // fois, derrière une modale qui demande le motif.
  moderation: CommonState;
  lastModeratedId: string | null;
  access: AdminAccess;
  settingsForm: PlatformSettingsForm | null;
  readSettings: CommonState;
  changeSettings: CommonState;
  journal: AdminJournalEntry[];
  readJournal: CommonState;
  issues: AdminRentalIssue[];
  listIssues: CommonState;
  resolveIssue: CommonState;
  resolvedIssueId: string | null;
}

const initialState: BackOfficeState = {
  overview: null,
  accounts: [],
  listings: [],
  rentalRequests: [],
  confirmAccess: initialCommonState,
  readOverview: initialCommonState,
  listAccounts: initialCommonState,
  listListings: initialCommonState,
  listRentalRequests: initialCommonState,
  moderation: initialCommonState,
  lastModeratedId: null,
  access: 'unknown',
  settingsForm: null,
  readSettings: initialCommonState,
  changeSettings: initialCommonState,
  journal: [],
  readJournal: initialCommonState,
  issues: [],
  listIssues: initialCommonState,
  resolveIssue: initialCommonState,
  resolvedIssueId: null,
};

const applyAccess = (state: BackOfficeState, failure: Failure): void => {
  if (failure.kind === 'forbidden') state.access = 'denied';
};

export const backOfficeReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(confirmAdminAccessRequested, (state) => {
      state.confirmAccess = { state: 'pending' };
    })
    .addCase(confirmAdminAccessSucceeded, (state) => {
      state.confirmAccess = { state: 'succeeded' };
      state.access = 'granted';
    })
    .addCase(confirmAdminAccessFailed, (state, action) => {
      state.confirmAccess = { state: 'failed', errorCode: action.payload.errorCode };
      applyAccess(state, action.payload);
    })
    .addCase(readOverviewRequested, (state) => {
      state.readOverview = { state: 'pending' };
    })
    .addCase(readOverviewSucceeded, (state, action) => {
      state.readOverview = { state: 'succeeded' };
      state.overview = action.payload;
      state.access = 'granted';
    })
    .addCase(readOverviewFailed, (state, action) => {
      state.readOverview = { state: 'failed', errorCode: action.payload.errorCode };
      applyAccess(state, action.payload);
    })

    .addCase(listAccountsRequested, (state) => {
      state.listAccounts = { state: 'pending' };
    })
    .addCase(listAccountsSucceeded, (state, action) => {
      state.listAccounts = { state: 'succeeded' };
      state.accounts = action.payload;
      state.access = 'granted';
    })
    .addCase(listAccountsFailed, (state, action) => {
      state.listAccounts = { state: 'failed', errorCode: action.payload.errorCode };
      applyAccess(state, action.payload);
    })

    .addCase(listListingsRequested, (state) => {
      state.listListings = { state: 'pending' };
    })
    .addCase(listListingsSucceeded, (state, action) => {
      state.listListings = { state: 'succeeded' };
      state.listings = action.payload;
      state.access = 'granted';
    })
    .addCase(listListingsFailed, (state, action) => {
      state.listListings = { state: 'failed', errorCode: action.payload.errorCode };
      applyAccess(state, action.payload);
    })

    .addCase(listRentalRequestsRequested, (state) => {
      state.listRentalRequests = { state: 'pending' };
    })
    .addCase(listRentalRequestsSucceeded, (state, action) => {
      state.listRentalRequests = { state: 'succeeded' };
      state.rentalRequests = action.payload;
      state.access = 'granted';
    })
    .addCase(listRentalRequestsFailed, (state, action) => {
      state.listRentalRequests = { state: 'failed', errorCode: action.payload.errorCode };
      applyAccess(state, action.payload);
    })

    .addCase(readPlatformSettingsRequested, (state) => {
      state.readSettings = { state: 'pending' };
    })
    .addCase(readPlatformSettingsSucceeded, (state, action) => {
      state.readSettings = { state: 'succeeded' };
      state.settingsForm = action.payload;
      state.access = 'granted';
    })
    .addCase(readPlatformSettingsFailed, (state, action) => {
      state.readSettings = { state: 'failed', errorCode: action.payload.errorCode };
      applyAccess(state, action.payload);
    })

    .addCase(changePlatformSettingsRequested, (state) => {
      state.changeSettings = { state: 'pending' };
    })
    .addCase(changePlatformSettingsSucceeded, (state) => {
      state.changeSettings = { state: 'succeeded' };
    })
    .addCase(changePlatformSettingsFailed, (state, action) => {
      state.changeSettings = { state: 'failed', errorCode: action.payload.errorCode };
      applyAccess(state, action.payload);
    })
    .addCase(resetChangePlatformSettings, (state) => {
      state.changeSettings = initialCommonState;
    })

    .addCase(readAdminJournalRequested, (state) => {
      state.readJournal = { state: 'pending' };
    })
    .addCase(readAdminJournalSucceeded, (state, action) => {
      state.readJournal = { state: 'succeeded' };
      state.journal = action.payload;
      state.access = 'granted';
    })
    .addCase(readAdminJournalFailed, (state, action) => {
      state.readJournal = { state: 'failed', errorCode: action.payload.errorCode };
      applyAccess(state, action.payload);
    })

    .addCase(listRentalIssuesRequested, (state) => {
      state.listIssues = { state: 'pending' };
    })
    .addCase(listRentalIssuesSucceeded, (state, action) => {
      state.listIssues = { state: 'succeeded' };
      state.issues = action.payload;
      state.access = 'granted';
    })
    .addCase(listRentalIssuesFailed, (state, action) => {
      state.listIssues = { state: 'failed', errorCode: action.payload.errorCode };
      applyAccess(state, action.payload);
    })

    .addCase(resolveRentalIssueRequested, (state) => {
      state.resolveIssue = { state: 'pending' };
    })
    .addCase(resolveRentalIssueSucceeded, (state, action) => {
      state.resolveIssue = { state: 'succeeded' };
      state.resolvedIssueId = action.payload.issueId;
    })
    .addCase(resolveRentalIssueFailed, (state, action) => {
      state.resolveIssue = { state: 'failed', errorCode: action.payload.errorCode };
      applyAccess(state, action.payload);
    })
    .addCase(resetResolveRentalIssue, (state) => {
      state.resolveIssue = initialCommonState;
    })

    .addCase(resetModerationState, (state) => {
      state.moderation = initialCommonState;
      state.lastModeratedId = null;
    })
    .addCase(logoutSucceeded, () => initialState)
    .addMatcher(isModerationRequested, (state) => {
      state.moderation = { state: 'pending' };
    })
    .addMatcher(isModerationSucceeded, (state, action) => {
      state.moderation = { state: 'succeeded' };
      state.lastModeratedId = action.payload.targetId;
    })
    .addMatcher(isModerationFailed, (state, action) => {
      state.moderation = { state: 'failed', errorCode: action.payload.errorCode };
      applyAccess(state, action.payload);
    });
});
