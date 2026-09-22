import { createReducer, isAnyOf } from '@reduxjs/toolkit';

import { initialCommonState, type CommonState } from '../../../store/CommonState';
import { logoutSucceeded } from '../../auth/domain/use-cases/sign-out/signOutEpic';
import type { AdminAccount } from '../domain/entities/AdminAccount';
import type { AdminListing } from '../domain/entities/AdminListing';
import type { AdminRentalRequest } from '../domain/entities/AdminRentalRequest';
import type { Overview } from '../domain/entities/Overview';
import type { Failure } from '../domain/ports/BackOfficeGateway';
import {
  cancelRentalRequestFailed,
  cancelRentalRequestRequested,
  cancelRentalRequestSucceeded,
} from '../domain/use-cases/cancel-rental-request/cancelRentalRequestEpic';
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
  readOverviewFailed,
  readOverviewRequested,
  readOverviewSucceeded,
} from '../domain/use-cases/read-overview/readOverviewEpic';
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
