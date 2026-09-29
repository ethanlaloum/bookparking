import { combineReducers } from '@reduxjs/toolkit';

import { accountReducer } from '../app/account/store/AccountSlice';
import { authReducer } from '../app/auth/store/AuthSlice';
import { backOfficeReducer } from '../app/back-office/store/BackOfficeSlice';
import { listingReducer } from '../app/listing/store/ListingSlice';
import { rentalReducer } from '../app/rental/store/RentalSlice';

export const coreReducer = combineReducers({
  account: accountReducer,
  auth: authReducer,
  backOffice: backOfficeReducer,
  listing: listingReducer,
  rental: rentalReducer,
});
