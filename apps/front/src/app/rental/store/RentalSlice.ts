import { createReducer } from '@reduxjs/toolkit';

import { logoutSucceeded } from '../../auth/domain/use-cases/sign-out/signOutEpic';
import { initialCommonState, type CommonState } from '../../../store/CommonState';
import {
  confirmRentalRequestFailed,
  confirmRentalRequestRequested,
  confirmRentalRequestSucceeded,
  resetConfirmRentalRequestState,
} from '../domain/use-cases/confirm-rental-request/confirmRentalRequestEpic';
import {
  requestRentalFailed,
  requestRentalRequested,
  requestRentalSucceeded,
  resetRequestRentalState,
} from '../domain/use-cases/request-rental/requestRentalEpic';
import type { RequestRentalPayload } from '../domain/ports/RentalGateway';
import {
  cancelRentalFailed,
  cancelRentalRequested,
  cancelRentalSucceeded,
} from '../domain/use-cases/cancel-rental/cancelRentalEpic';
import {
  abandonRentalRequestFailed,
  abandonRentalRequestRequested,
  abandonRentalRequestSucceeded,
} from '../domain/use-cases/abandon-rental-request/abandonRentalRequestEpic';
import type { RentalRequestView } from '../domain/entities/RentalRequestView';
import {
  listMyRentalRequestsFailed,
  listMyRentalRequestsRequested,
  listMyRentalRequestsSucceeded,
} from '../domain/use-cases/list-my-rental-requests/listMyRentalRequestsEpic';
import {
  listReceivedRentalRequestsFailed,
  listReceivedRentalRequestsRequested,
  listReceivedRentalRequestsSucceeded,
} from '../domain/use-cases/list-received-rental-requests/listReceivedRentalRequestsEpic';

export interface RentalState {
  lastRequested: (RequestRentalPayload & { requestId: string }) | null;
  myRequests: RentalRequestView[];
  receivedRequests: RentalRequestView[];
  request: CommonState;
  confirm: CommonState;
  abandon: CommonState;
  abandonedRequestId: string | null;
  cancel: CommonState;
  cancelledRequestId: string | null;
  listMine: CommonState;
  listReceived: CommonState;
}

const initialState: RentalState = {
  lastRequested: null,
  myRequests: [],
  receivedRequests: [],
  request: initialCommonState,
  confirm: initialCommonState,
  abandon: initialCommonState,
  abandonedRequestId: null,
  cancel: initialCommonState,
  cancelledRequestId: null,
  listMine: initialCommonState,
  listReceived: initialCommonState,
};

export const rentalReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(requestRentalRequested, (state) => {
      state.request = { state: 'pending' };
    })
    .addCase(requestRentalSucceeded, (state, action) => {
      state.request = { state: 'succeeded' };
      state.lastRequested = action.payload;
    })
    .addCase(requestRentalFailed, (state, action) => {
      state.request = { state: 'failed', errorCode: action.payload.errorCode };
    })
    .addCase(resetRequestRentalState, (state) => {
      state.request = initialCommonState;
      state.lastRequested = null;
    })
    .addCase(cancelRentalRequested, (state) => {
      state.cancel = { state: 'pending' };
    })
    .addCase(cancelRentalSucceeded, (state, action) => {
      state.cancel = { state: 'succeeded' };
      state.cancelledRequestId = action.payload.requestId;
    })
    .addCase(cancelRentalFailed, (state, action) => {
      state.cancel = { state: 'failed', errorCode: action.payload.errorCode };
    })
    .addCase(abandonRentalRequestRequested, (state) => {
      state.abandon = { state: 'pending' };
    })
    .addCase(abandonRentalRequestSucceeded, (state, action) => {
      state.abandon = { state: 'succeeded' };
      state.abandonedRequestId = action.payload.requestId;
    })
    .addCase(abandonRentalRequestFailed, (state, action) => {
      state.abandon = { state: 'failed', errorCode: action.payload.errorCode };
    })
    .addCase(confirmRentalRequestRequested, (state) => {
      state.confirm = { state: 'pending' };
    })
    .addCase(confirmRentalRequestSucceeded, (state) => {
      state.confirm = { state: 'succeeded' };
    })
    .addCase(confirmRentalRequestFailed, (state, action) => {
      state.confirm = { state: 'failed', errorCode: action.payload.errorCode };
    })
    .addCase(resetConfirmRentalRequestState, (state) => {
      state.confirm = initialCommonState;
    })
    .addCase(listMyRentalRequestsRequested, (state) => {
      state.listMine = { state: 'pending' };
    })
    .addCase(listMyRentalRequestsSucceeded, (state, action) => {
      state.listMine = { state: 'succeeded' };
      state.myRequests = action.payload;
    })
    .addCase(listMyRentalRequestsFailed, (state, action) => {
      state.listMine = { state: 'failed', errorCode: action.payload.errorCode };
    })
    .addCase(listReceivedRentalRequestsRequested, (state) => {
      state.listReceived = { state: 'pending' };
    })
    .addCase(listReceivedRentalRequestsSucceeded, (state, action) => {
      state.listReceived = { state: 'succeeded' };
      state.receivedRequests = action.payload;
    })
    .addCase(listReceivedRentalRequestsFailed, (state, action) => {
      state.listReceived = { state: 'failed', errorCode: action.payload.errorCode };
    })
    .addCase(logoutSucceeded, () => initialState);
});
