import { combineReducers } from '@reduxjs/toolkit';

import { accountReducer } from '../app/account/store/AccountSlice';
import { authReducer } from '../app/auth/store/AuthSlice';
import { consentReducer } from '../app/consent/store/ConsentSlice';
import { listingReducer } from '../app/listing/store/ListingSlice';
import { notificationReducer } from '../app/notification/store/NotificationSlice';
import { payoutReducer } from '../app/payout/store/PayoutSlice';
import { rentalReducer } from '../app/rental/store/RentalSlice';
import { rentalTermsReducer } from '../app/rental-terms/store/RentalTermsSlice';

export const coreReducer = combineReducers({
  account: accountReducer,
  auth: authReducer,
  consent: consentReducer,
  listing: listingReducer,
  notification: notificationReducer,
  payout: payoutReducer,
  rental: rentalReducer,
  rentalTerms: rentalTermsReducer,
});
