import type { Avatar } from '../../entities/Avatar';
import { logoutRequested } from '../../../../auth/domain/use-cases/sign-out/signOutEpic';
import { selectOwnAvatar, selectOwnEmail } from '../../../../../selectors/account/accountSelectors';
import {
  buildInMemoryDependencies,
  type InMemoryDependencies,
} from '../../../../../store/testing/InMemoryDependencies';
import { createTestStore } from '../../../../../store/testing/createTestStore';
import type { OwnAccount } from '../../entities/Account';
import { readOwnAccountRequested } from './readOwnAccountEpic';

export const createReadOwnAccountSut = () => {
  const dependencies: InMemoryDependencies = buildInMemoryDependencies();
  const store = createTestStore(dependencies);

  return {
    givenTheSignedInAccountIs(account: OwnAccount): void {
      dependencies.accountGateway.ownAccount = account;
    },
    givenTheApiRejectsWith(message: string): void {
      dependencies.accountGateway.ownAccountRejection = message;
    },
    whenTheAccountIsRead(): void {
      store.dispatch(readOwnAccountRequested());
    },
    whenSigningOut(): void {
      store.dispatch(logoutRequested());
    },
    thenTheAvatarShownIs(expected: Avatar | null): void {
      const actual = selectOwnAvatar(store.getState());
      if (actual !== expected) throw new Error(`Avatar attendu ${String(expected)}, obtenu ${String(actual)}`);
    },
    thenTheEmailShownIs(expected: string | null): void {
      const actual = selectOwnEmail(store.getState());
      if (actual !== expected) throw new Error(`Adresse attendue ${String(expected)}, obtenue ${String(actual)}`);
    },
  };
};
