import { createSelector } from '@reduxjs/toolkit';

import {
  byMostRecentlyRegistered,
  countSuspended,
  type AdminAccount,
} from '../app/back-office/domain/entities/AdminAccount';
import {
  byMostRecentlyPublished,
  countActive,
  type AdminListing,
} from '../app/back-office/domain/entities/AdminListing';
import {
  byMostRecentlyRequested,
  countWaitingOverADay,
  type AdminRentalRequest,
} from '../app/back-office/domain/entities/AdminRentalRequest';
import {
  matchesFilter,
  type AdminJournalEntry,
  type JournalFilter,
} from '../app/back-office/domain/entities/AdminJournalEntry';
import { isOpen, type AdminRentalIssue } from '../app/back-office/domain/entities/AdminRentalIssue';
import { needsAttention, type Overview } from '../app/back-office/domain/entities/Overview';
import type { PlatformSettingsForm } from '../app/back-office/domain/entities/PlatformSettings';
import type { AdminAccess } from '../app/back-office/store/BackOfficeSlice';
import type { AppState } from '../store/AppState';

export const selectOverview = (state: AppState): Overview | null => state.core.backOffice.overview;

export const selectAdminAccess = (state: AppState): AdminAccess => state.core.backOffice.access;

export const selectOverviewLoading = (state: AppState): boolean =>
  state.core.backOffice.readOverview.state === 'pending';

export const selectOverviewError = (state: AppState): string | null =>
  state.core.backOffice.readOverview.state === 'failed'
    ? (state.core.backOffice.readOverview.errorCode ?? null)
    : null;

export const selectNeedsAttention = (state: AppState): boolean => {
  const overview = state.core.backOffice.overview;
  return overview !== null && needsAttention(overview.attention);
};

export const selectAccounts = (state: AppState): AdminAccount[] => state.core.backOffice.accounts;

export const selectAccountsLoading = (state: AppState): boolean =>
  state.core.backOffice.listAccounts.state === 'pending';

export const selectAccountsError = (state: AppState): string | null =>
  state.core.backOffice.listAccounts.state === 'failed'
    ? (state.core.backOffice.listAccounts.errorCode ?? null)
    : null;

export const selectListings = (state: AppState): AdminListing[] => state.core.backOffice.listings;

export const selectListingsLoading = (state: AppState): boolean =>
  state.core.backOffice.listListings.state === 'pending';

export const selectListingsError = (state: AppState): string | null =>
  state.core.backOffice.listListings.state === 'failed'
    ? (state.core.backOffice.listListings.errorCode ?? null)
    : null;

export const selectRentalRequests = (state: AppState): AdminRentalRequest[] =>
  state.core.backOffice.rentalRequests;

export const selectRentalRequestsLoading = (state: AppState): boolean =>
  state.core.backOffice.listRentalRequests.state === 'pending';

export const selectRentalRequestsError = (state: AppState): string | null =>
  state.core.backOffice.listRentalRequests.state === 'failed'
    ? (state.core.backOffice.listRentalRequests.errorCode ?? null)
    : null;

export const selectModerationLoading = (state: AppState): boolean =>
  state.core.backOffice.moderation.state === 'pending';

export const selectModerationError = (state: AppState): string | null =>
  state.core.backOffice.moderation.state === 'failed'
    ? (state.core.backOffice.moderation.errorCode ?? null)
    : null;

export const selectModerationSuccess = (state: AppState): boolean =>
  state.core.backOffice.moderation.state === 'succeeded';

export const selectLastModeratedId = (state: AppState): string | null =>
  state.core.backOffice.lastModeratedId;

export const selectSortedAccounts = createSelector([selectAccounts], (accounts) =>
  [...accounts].sort(byMostRecentlyRegistered),
);

export const selectSortedListings = createSelector([selectListings], (listings) =>
  [...listings].sort(byMostRecentlyPublished),
);

export const selectSortedRentalRequests = createSelector([selectRentalRequests], (requests) =>
  [...requests].sort(byMostRecentlyRequested),
);

export const selectSuspendedAccountCount = createSelector([selectAccounts], countSuspended);

export const selectActiveListingCount = createSelector([selectListings], countActive);

/**
 * Le même chiffre que `attention.requestsPendingOverADay` du tableau de bord,
 * mais recalculé depuis la liste chargée : il sert à en-tête de la page des
 * demandes, où l'api n'est pas consultée une seconde fois. Les deux peuvent
 * différer d'une unité pendant la minute où une demande franchit les
 * vingt-quatre heures — documenté dans `AdminRentalRequest.ts`.
 */
export const selectRequestsWaitingOverADay = (state: AppState, now: Date): number =>
  countWaitingOverADay(state.core.backOffice.rentalRequests, now);

export const selectPlatformSettingsForm = (state: AppState): PlatformSettingsForm | null =>
  state.core.backOffice.settingsForm;

export const selectPlatformSettingsError = (state: AppState): string | null =>
  state.core.backOffice.readSettings.state === 'failed'
    ? (state.core.backOffice.readSettings.errorCode ?? null)
    : null;

export const selectChangeSettingsPending = (state: AppState): boolean =>
  state.core.backOffice.changeSettings.state === 'pending';

export const selectChangeSettingsSuccess = (state: AppState): boolean =>
  state.core.backOffice.changeSettings.state === 'succeeded';

export const selectChangeSettingsError = (state: AppState): string | null =>
  state.core.backOffice.changeSettings.state === 'failed'
    ? (state.core.backOffice.changeSettings.errorCode ?? null)
    : null;

export const selectJournalLoading = (state: AppState): boolean =>
  state.core.backOffice.readJournal.state === 'pending';

export const selectJournalError = (state: AppState): string | null =>
  state.core.backOffice.readJournal.state === 'failed'
    ? (state.core.backOffice.readJournal.errorCode ?? null)
    : null;

// L'api rend déjà le journal du plus récent au plus ancien : le filtre ne
// réordonne rien.
export const selectJournal = (state: AppState, filter: JournalFilter): AdminJournalEntry[] =>
  state.core.backOffice.journal.filter((entry) => matchesFilter(entry, filter));

export const selectRentalIssues = (state: AppState): AdminRentalIssue[] =>
  state.core.backOffice.issues;

export const selectRentalIssuesLoading = (state: AppState): boolean =>
  state.core.backOffice.listIssues.state === 'pending';

export const selectRentalIssuesError = (state: AppState): string | null =>
  state.core.backOffice.listIssues.state === 'failed'
    ? (state.core.backOffice.listIssues.errorCode ?? null)
    : null;

export const selectOpenRentalIssueCount = createSelector(
  [selectRentalIssues],
  (issues) => issues.filter(isOpen).length,
);

export const selectResolveIssuePending = (state: AppState): boolean =>
  state.core.backOffice.resolveIssue.state === 'pending';

export const selectResolveIssueError = (state: AppState): string | null =>
  state.core.backOffice.resolveIssue.state === 'failed'
    ? (state.core.backOffice.resolveIssue.errorCode ?? null)
    : null;

export const selectResolvedIssueId = (state: AppState): string | null =>
  state.core.backOffice.resolveIssue.state === 'succeeded'
    ? state.core.backOffice.resolvedIssueId
    : null;
