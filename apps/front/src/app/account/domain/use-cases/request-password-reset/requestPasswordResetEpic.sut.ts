import { expect } from 'vitest';

import {
  selectPasswordResetSentTo,
  selectRequestPasswordResetError,
  selectRequestPasswordResetLoading,
} from '../../../../../selectors/account/accountSelectors';
import {
  buildInMemoryDependencies,
  type InMemoryDependencies,
} from '../../../../../store/testing/InMemoryDependencies';
import { createTestStore } from '../../../../../store/testing/createTestStore';
import {
  requestPasswordResetRequested,
  resetRequestPasswordResetState,
} from './requestPasswordResetEpic';

export const createRequestPasswordResetSut = () => {
  const dependencies: InMemoryDependencies = buildInMemoryDependencies();
  const store = createTestStore(dependencies);

  return {
    givenTheApiRejectsWith(message: string): void {
      dependencies.accountGateway.passwordResetRequestRejection = message;
    },
    whenRequestingAResetFor(email: string): void {
      store.dispatch(requestPasswordResetRequested(email));
    },
    whenLeavingThePage(): void {
      store.dispatch(resetRequestPasswordResetState());
    },
    thenTheAddressesSentAre(expected: string[]): void {
      expect(dependencies.accountGateway.passwordResetRequests).toEqual(expected);
    },
    thenTheScreenShows(expected: {
      loading: boolean;
      error: string | null;
      sentTo: string | null;
    }): void {
      const state = store.getState();
      expect({
        loading: selectRequestPasswordResetLoading(state),
        error: selectRequestPasswordResetError(state),
        sentTo: selectPasswordResetSentTo(state),
      }).toEqual(expected);
    },
  };
};
