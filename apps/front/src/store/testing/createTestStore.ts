import { configureStore, type Action } from '@reduxjs/toolkit';
import { createEpicMiddleware } from 'redux-observable';

import type { AppState } from '../AppState';
import { coreReducer } from '../coreReducer';
import type { Dependencies } from '../dependencies.interface';
import { rootEpic } from '../epics';

export const createTestStore = (dependencies: Dependencies) => {
  const epicMiddleware = createEpicMiddleware<Action, Action, AppState, Dependencies>({
    dependencies,
  });

  const store = configureStore({
    reducer: { core: coreReducer },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ thunk: false }).concat(epicMiddleware),
  });

  epicMiddleware.run(rootEpic);

  return store;
};
