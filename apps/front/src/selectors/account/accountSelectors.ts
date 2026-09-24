import type { Account, OwnAccount } from '../../app/account/domain/entities/Account';
import type { Avatar } from '../../app/account/domain/entities/Avatar';
import type { HumanProof } from '../../app/account/domain/entities/HumanProof';
import type { AppState } from '../../store/AppState';

export const selectAccount = (state: AppState): Account | null => state.core.account.account;

export const selectOwnAccount = (state: AppState): OwnAccount | null => state.core.account.ownAccount;

export const selectOwnEmail = (state: AppState): string | null =>
  state.core.account.ownAccount?.email ?? null;

// `null` tant que le compte n'est pas lu : l'écran garde alors l'icône générique.
export const selectOwnAvatar = (state: AppState): Avatar | null =>
  state.core.account.ownAccount?.avatar ?? null;

export const selectChooseAvatarLoading = (state: AppState): boolean =>
  state.core.account.chooseAvatar.state === 'pending';

export const selectChooseAvatarError = (state: AppState): string | null =>
  state.core.account.chooseAvatar.state === 'failed'
    ? (state.core.account.chooseAvatar.errorCode ?? null)
    : null;

export const selectChooseAvatarSuccess = (state: AppState): boolean =>
  state.core.account.chooseAvatar.state === 'succeeded';

export const selectRegisterLoading = (state: AppState): boolean =>
  state.core.account.register.state === 'pending';

export const selectRegisterError = (state: AppState): string | null =>
  state.core.account.register.state === 'failed'
    ? (state.core.account.register.errorCode ?? null)
    : null;

export const selectRegisterSuccess = (state: AppState): boolean =>
  state.core.account.register.state === 'succeeded';

export const selectChangePasswordLoading = (state: AppState): boolean =>
  state.core.account.changePassword.state === 'pending';

export const selectChangePasswordError = (state: AppState): string | null =>
  state.core.account.changePassword.state === 'failed'
    ? (state.core.account.changePassword.errorCode ?? null)
    : null;

export const selectChangePasswordSuccess = (state: AppState): boolean =>
  state.core.account.changePassword.state === 'succeeded';

export const selectHumanProof = (state: AppState): HumanProof | null => state.core.account.proof;

export const selectHumanProofPending = (state: AppState): boolean =>
  state.core.account.humanProof.state === 'pending';

export const selectHumanProofFailed = (state: AppState): boolean =>
  state.core.account.humanProof.state === 'failed';
