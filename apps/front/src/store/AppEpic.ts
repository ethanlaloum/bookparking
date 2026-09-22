import type { Action } from '@reduxjs/toolkit';
import type { Epic } from 'redux-observable';

import type { Dependencies } from './dependencies.interface';
import type { AppState } from './AppState';

export type AppEpic = Epic<Action, Action, AppState, Dependencies>;
