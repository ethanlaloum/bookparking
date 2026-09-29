import { combineEpics } from 'redux-observable';

import type { AppEpic } from '../AppEpic';
import { accountEpics } from './accountEpics';
import { authEpics } from './authEpics';
import { listingEpics } from './listingEpics';
import { rentalEpics } from './rentalEpics';

export const rootEpic: AppEpic = combineEpics(
  ...authEpics,
  ...accountEpics,
  ...listingEpics,
  ...rentalEpics,
);
