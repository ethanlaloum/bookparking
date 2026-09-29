import { combineReducers } from '@reduxjs/toolkit';

import { authReducer } from '../app/auth/store/AuthSlice';
import { backOfficeReducer } from '../app/back-office/store/BackOfficeSlice';

export const coreReducer = combineReducers({
  auth: authReducer,
  backOffice: backOfficeReducer,
});
