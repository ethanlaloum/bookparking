import { combineEpics } from 'redux-observable';

import type { AppEpic } from '../AppEpic';
import { authEpics } from './authEpics';
import { backOfficeEpics } from './backOfficeEpics';

export const rootEpic: AppEpic = combineEpics(...authEpics, ...backOfficeEpics);
