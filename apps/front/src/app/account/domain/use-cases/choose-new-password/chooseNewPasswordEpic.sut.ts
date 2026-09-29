import { expect } from 'vitest';

import {
  selectChooseNewPasswordError,
  selectChooseNewPasswordLoading,
  selectChooseNewPasswordSuccess,
} from '../../../../../selectors/account/accountSelectors';
import {
  buildInMemoryDependencies,
  type InMemoryDependencies,
} from '../../../../../store/testing/InMemoryDependencies';
import { createTestStore } from '../../../../../store/testing/createTestStore';
import type { ResetPasswordPayload } from '../../ports/AccountGateway';
import { chooseNewPasswordRequested, resetChooseNewPasswordState } from './chooseNewPasswordEpic';

export const createChooseNewPasswordSut = () => {
  const dependencies: InMemoryDependencies = buildInMemoryDependencies();
  const store = createTestStore(dependencies);

  return {
    givenTheApiRejectsWith(message: string): void {
      dependencies.accountGateway.passwordResetRejection = message;
    },
    whenChoosing(payload: ResetPasswordPayload): void {
      store.dispatch(chooseNewPasswordRequested(payload));
    },
    whenLeavingThePage(): void {
      store.dispatch(resetChooseNewPasswordState());
    },
    thenTheResetsSentAre(expected: ResetPasswordPayload[]): void {
      expect(dependencies.accountGateway.passwordResets).toEqual(expected);
    },
    thenTheScreenShows(expected: {
      loading: boolean;
      error: string | null;
      success: boolean;
    }): void {
      const state = store.getState();
      expect({
        loading: selectChooseNewPasswordLoading(state),
        error: selectChooseNewPasswordError(state),
        success: selectChooseNewPasswordSuccess(state),
      }).toEqual(expected);
    },
  };
};
