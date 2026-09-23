import { combineEpics } from 'redux-observable';

import type { AppEpic } from '../AppEpic';
import { accountEpics } from './accountEpics';
import { authEpics } from './authEpics';
import { backOfficeEpics } from './backOfficeEpics';
import { consentEpics } from './consentEpics';
import { listingEpics } from './listingEpics';
import { rentalEpics } from './rentalEpics';

export const rootEpic: AppEpic = combineEpics(
  ...authEpics,
  ...accountEpics,
  ...listingEpics,
  ...rentalEpics,
  ...backOfficeEpics,
  ...consentEpics,
);
