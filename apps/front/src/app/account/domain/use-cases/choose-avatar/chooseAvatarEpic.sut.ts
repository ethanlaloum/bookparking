import {
  selectChooseAvatarError,
  selectOwnAvatar,
} from '../../../../../selectors/account/accountSelectors';
import {
  buildInMemoryDependencies,
  type InMemoryDependencies,
} from '../../../../../store/testing/InMemoryDependencies';
import { createTestStore } from '../../../../../store/testing/createTestStore';
import type { OwnAccount } from '../../entities/Account';
import type { Avatar } from '../../entities/Avatar';
import { readOwnAccountRequested } from '../read-own-account/readOwnAccountEpic';
import { chooseAvatarRequested } from './chooseAvatarEpic';

export const createChooseAvatarSut = () => {
  const dependencies: InMemoryDependencies = buildInMemoryDependencies();
  const store = createTestStore(dependencies);

  return {
    givenTheSignedInAccountIs(account: OwnAccount): void {
      dependencies.accountGateway.ownAccount = account;
      store.dispatch(readOwnAccountRequested());
    },
    givenTheApiHasNotAnsweredYet(): void {
      dependencies.accountGateway.avatarResponseHeld = true;
    },
    givenTheApiRejectsWith(message: string): void {
      dependencies.accountGateway.avatarRejection = message;
    },
    whenChoosing(avatar: Avatar): void {
      store.dispatch(chooseAvatarRequested(avatar));
    },
    thenTheAvatarSentIs(expected: Avatar): void {
      const sent = dependencies.accountGateway.avatarsChosen;
      if (sent.length !== 1 || sent[0] !== expected)
        throw new Error(`Avatar envoyé attendu ${expected}, obtenu ${JSON.stringify(sent)}`);
    },
    thenTheAvatarShownIs(expected: Avatar | null): void {
      const actual = selectOwnAvatar(store.getState());
      if (actual !== expected) throw new Error(`Avatar attendu ${String(expected)}, obtenu ${String(actual)}`);
    },
    thenTheErrorShownIs(expected: string | null): void {
      const actual = selectChooseAvatarError(store.getState());
      if (actual !== expected) throw new Error(`Erreur attendue ${String(expected)}, obtenue ${String(actual)}`);
    },
  };
};
