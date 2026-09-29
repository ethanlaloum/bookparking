import { createReducer } from '@reduxjs/toolkit';

import { initialCommonState, type CommonState } from '../../../store/CommonState';
import type { RentalTerms } from '../domain/entities/RentalTerms';
import {
  readRentalTermsFailed,
  readRentalTermsRequested,
  readRentalTermsSucceeded,
} from '../domain/use-cases/read-rental-terms/readRentalTermsEpic';

// Rien ici ne dépend du compte : la déconnexion n'efface pas les conditions,
// qui sont les mêmes pour tout visiteur.
export interface RentalTermsState {
  terms: RentalTerms | null;
  read: CommonState;
}

const initialState: RentalTermsState = {
  terms: null,
  read: initialCommonState,
};

export const rentalTermsReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(readRentalTermsRequested, (state) => {
      state.read = { state: 'pending' };
    })
    .addCase(readRentalTermsSucceeded, (state, action) => {
      state.read = { state: 'succeeded' };
      state.terms = action.payload;
    })
    .addCase(readRentalTermsFailed, (state, action) => {
      state.read = { state: 'failed', errorCode: action.payload.errorCode };
    });
});
