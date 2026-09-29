import { expect } from 'vitest';

import {
  selectAccountDeleted,
  selectDeleteAccountError,
  selectDeleteAccountLoading,
} from '../../../../../selectors/account/accountSelectors';
import { selectSession } from '../../../../../selectors/auth/authSelectors';
import {
  buildInMemoryDependencies,
  type InMemoryDependencies,
} from '../../../../../store/testing/InMemoryDependencies';
import { createTestStore } from '../../../../../store/testing/createTestStore';
import type { Session } from '../../../../auth/domain/entities/Session';
import { signInSucceeded } from '../../../../auth/domain/use-cases/sign-in/signInEpic';
import { deleteAccountRequested, resetDeleteAccountState } from './deleteAccountEpic';

export const createDeleteAccountSut = () => {
  const dependencies: InMemoryDependencies = buildInMemoryDependencies();
  const store = createTestStore(dependencies);

  return {
    givenSignedInWith(session: Session): void {
      dependencies.sessionStore.save(session);
      store.dispatch(signInSucceeded(session));
    },
    givenTheApiRejectsWith(message: string): void {
      dependencies.accountGateway.accountDeletionRejection = message;
    },
    whenDeleting(password: string): void {
      store.dispatch(deleteAccountRequested({ password }));
    },
    whenSigningInAgain(session: Session): void {
      store.dispatch(signInSucceeded(session));
    },
    whenClosingTheDialog(): void {
      store.dispatch(resetDeleteAccountState());
    },
    thenThePasswordsSentAre(expected: string[]): void {
      expect(dependencies.accountGateway.accountDeletions).toEqual(expected);
    },
    thenTheSessionIs(expected: { kept: Session | null; stored: Session | null }): void {
      expect({
        kept: selectSession(store.getState()),
        stored: dependencies.sessionStore.saved,
      }).toEqual(expected);
    },
    thenTheScreenShows(expected: {
      loading: boolean;
      error: string | null;
      deleted: boolean;
    }): void {
      const state = store.getState();
      expect({
        loading: selectDeleteAccountLoading(state),
        error: selectDeleteAccountError(state),
        deleted: selectAccountDeleted(state),
      }).toEqual(expected);
    },
  };
};
