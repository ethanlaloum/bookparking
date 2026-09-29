import { combineEpics } from 'redux-observable';

import type { AppEpic } from '../AppEpic';
import { accountEpics } from './accountEpics';
import { authEpics } from './authEpics';
import { consentEpics } from './consentEpics';
import { listingEpics } from './listingEpics';
import { notificationEpics } from './notificationEpics';
import { payoutEpics } from './payoutEpics';
import { rentalEpics } from './rentalEpics';
import { rentalTermsEpics } from './rentalTermsEpics';

export const rootEpic: AppEpic = combineEpics(
  ...authEpics,
  ...accountEpics,
  ...listingEpics,
  ...rentalEpics,
  ...consentEpics,
  ...notificationEpics,
  ...payoutEpics,
  ...rentalTermsEpics,
);
