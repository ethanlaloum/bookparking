import type { RequestRentalPayload } from '../../app/rental/domain/ports/RentalGateway';
import { createSelector } from '@reduxjs/toolkit';

import {
  byMostRecentlyRequested,
  confirmedRevenueInCents,
  countByStatus,
  pendingRevenueInCents,
  type RentalRequestView,
} from '../../app/rental/domain/entities/RentalRequestView';
import type { AppState } from '../../store/AppState';

export const selectLastRequestedRental = (state: AppState): RequestRentalPayload | null =>
  state.core.rental.lastRequested;

export const selectRequestRentalLoading = (state: AppState): boolean =>
  state.core.rental.request.state === 'pending';

export const selectRequestRentalError = (state: AppState): string | null =>
  state.core.rental.request.state === 'failed'
    ? (state.core.rental.request.errorCode ?? null)
    : null;

export const selectRequestRentalSuccess = (state: AppState): boolean =>
  state.core.rental.request.state === 'succeeded';

export const selectConfirmRentalLoading = (state: AppState): boolean =>
  state.core.rental.confirm.state === 'pending';

export const selectConfirmRentalError = (state: AppState): string | null =>
  state.core.rental.confirm.state === 'failed'
    ? (state.core.rental.confirm.errorCode ?? null)
    : null;

export const selectConfirmRentalSuccess = (state: AppState): boolean =>
  state.core.rental.confirm.state === 'succeeded';

export const selectMyRentalRequests = (state: AppState): RentalRequestView[] =>
  state.core.rental.myRequests;

export const selectReceivedRentalRequests = (state: AppState): RentalRequestView[] =>
  state.core.rental.receivedRequests;

export const selectMyRentalRequestsLoading = (state: AppState): boolean =>
  state.core.rental.listMine.state === 'pending';

export const selectMyRentalRequestsLoaded = (state: AppState): boolean =>
  state.core.rental.listMine.state === 'succeeded';

export const selectMyRentalRequestsError = (state: AppState): string | null =>
  state.core.rental.listMine.state === 'failed'
    ? (state.core.rental.listMine.errorCode ?? null)
    : null;

export const selectReceivedRentalRequestsLoading = (state: AppState): boolean =>
  state.core.rental.listReceived.state === 'pending';

export const selectReceivedRentalRequestsLoaded = (state: AppState): boolean =>
  state.core.rental.listReceived.state === 'succeeded';

export const selectReceivedRentalRequestsError = (state: AppState): string | null =>
  state.core.rental.listReceived.state === 'failed'
    ? (state.core.rental.listReceived.errorCode ?? null)
    : null;

export const selectSortedReceivedRequests = createSelector(
  [selectReceivedRentalRequests],
  (requests) => [...requests].sort(byMostRecentlyRequested),
);

export const selectSortedMyRequests = createSelector([selectMyRentalRequests], (requests) =>
  [...requests].sort(byMostRecentlyRequested),
);

export const selectConfirmedRevenueInCents = createSelector(
  [selectReceivedRentalRequests],
  confirmedRevenueInCents,
);

export const selectPendingRevenueInCents = createSelector(
  [selectReceivedRentalRequests],
  pendingRevenueInCents,
);

export const selectReceivedCountByStatus = createSelector(
  [selectReceivedRentalRequests],
  countByStatus,
);
