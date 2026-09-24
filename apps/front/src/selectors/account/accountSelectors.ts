import type { Account } from '../../app/account/domain/entities/Account';
import type { HumanProof } from '../../app/account/domain/entities/HumanProof';
import type { AppState } from '../../store/AppState';

export const selectAccount = (state: AppState): Account | null => state.core.account.account;

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
