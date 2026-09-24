import { createReducer } from '@reduxjs/toolkit';

import { logoutSucceeded } from '../../auth/domain/use-cases/sign-out/signOutEpic';
import { initialCommonState, type CommonState } from '../../../store/CommonState';
import {
  changePasswordFailed,
  changePasswordRequested,
  changePasswordSucceeded,
  resetChangePasswordState,
} from '../domain/use-cases/change-password/changePasswordEpic';
import {
  registerAccountFailed,
  registerAccountRequested,
  registerAccountSucceeded,
  resetRegisterAccountState,
} from '../domain/use-cases/register-account/registerAccountEpic';
import type { Account, OwnAccount } from '../domain/entities/Account';
import type { Avatar } from '../domain/entities/Avatar';
import {
  chooseAvatarFailed,
  chooseAvatarRequested,
  chooseAvatarSucceeded,
  resetChooseAvatarState,
} from '../domain/use-cases/choose-avatar/chooseAvatarEpic';
import {
  readOwnAccountFailed,
  readOwnAccountRequested,
  readOwnAccountSucceeded,
} from '../domain/use-cases/read-own-account/readOwnAccountEpic';
import type { HumanProof } from '../domain/entities/HumanProof';
import {
  humanProofFailed,
  humanProofRequested,
  humanProofSolved,
} from '../domain/use-cases/human-proof/humanProofEpic';

export interface AccountState {
  account: Account | null;
  register: CommonState;
  changePassword: CommonState;
  humanProof: CommonState;
  proof: HumanProof | null;
  // Le compte connecté, lu par `GET /account` : l'adresse et l'avatar.
  ownAccount: OwnAccount | null;
  readOwnAccount: CommonState;
  chooseAvatar: CommonState;
  // Le pilote d'avant un choix en cours, rendu si l'api le refuse.
  avatarBeforeChoice: Avatar | null;
}

const initialState: AccountState = {
  account: null,
  register: initialCommonState,
  changePassword: initialCommonState,
  humanProof: initialCommonState,
  proof: null,
  ownAccount: null,
  readOwnAccount: initialCommonState,
  chooseAvatar: initialCommonState,
  avatarBeforeChoice: null,
};

export const accountReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(registerAccountRequested, (state) => {
      state.register = { state: 'pending' };
      // Présentée à l'api, la preuve est dépensée.
      state.proof = null;
      state.humanProof = initialCommonState;
    })
    .addCase(humanProofRequested, (state) => {
      state.humanProof = { state: 'pending' };
      state.proof = null;
    })
    .addCase(registerAccountFailed, (state, action) => {
      state.register = { state: 'failed', errorCode: action.payload.errorCode };
      state.humanProof = { state: 'pending' };
    })
    .addCase(humanProofSolved, (state, action) => {
      state.humanProof = { state: 'succeeded' };
      state.proof = action.payload;
    })
    .addCase(humanProofFailed, (state, action) => {
      state.humanProof = { state: 'failed', errorCode: action.payload.errorCode };
    })
    .addCase(registerAccountSucceeded, (state, action) => {
      state.register = { state: 'succeeded' };
      state.account = action.payload;
    })
    .addCase(resetRegisterAccountState, (state) => {
      state.register = initialCommonState;
    })
    .addCase(changePasswordRequested, (state) => {
      state.changePassword = { state: 'pending' };
    })
    .addCase(changePasswordSucceeded, (state) => {
      state.changePassword = { state: 'succeeded' };
    })
    .addCase(changePasswordFailed, (state, action) => {
      state.changePassword = { state: 'failed', errorCode: action.payload.errorCode };
    })
    .addCase(resetChangePasswordState, (state) => {
      state.changePassword = initialCommonState;
    })
    .addCase(readOwnAccountRequested, (state) => {
      state.readOwnAccount = { state: 'pending' };
    })
    .addCase(readOwnAccountSucceeded, (state, action) => {
      state.readOwnAccount = { state: 'succeeded' };
      state.ownAccount = action.payload;
    })
    // Une lecture ratée ne garde pas l'avatar d'un autre compte : l'icône
    // générique vaut mieux qu'un visage qui n'est pas le sien.
    .addCase(readOwnAccountFailed, (state, action) => {
      state.readOwnAccount = { state: 'failed', errorCode: action.payload.errorCode };
      state.ownAccount = null;
    })
    // Le pilote touché s'affiche aussitôt : attendre la réponse de l'api
    // laisserait le clic sans effet visible. Un refus rend le précédent.
    .addCase(chooseAvatarRequested, (state, action) => {
      state.chooseAvatar = { state: 'pending' };
      if (state.ownAccount === null) return;
      state.avatarBeforeChoice = state.ownAccount.avatar;
      state.ownAccount.avatar = action.payload;
    })
    .addCase(chooseAvatarSucceeded, (state) => {
      state.chooseAvatar = { state: 'succeeded' };
      state.avatarBeforeChoice = null;
    })
    .addCase(chooseAvatarFailed, (state, action) => {
      state.chooseAvatar = { state: 'failed', errorCode: action.payload.errorCode };
      if (state.ownAccount !== null && state.avatarBeforeChoice !== null)
        state.ownAccount.avatar = state.avatarBeforeChoice;
      state.avatarBeforeChoice = null;
    })
    .addCase(resetChooseAvatarState, (state) => {
      state.chooseAvatar = initialCommonState;
    })
    .addCase(logoutSucceeded, () => initialState);
});
