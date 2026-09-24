import { changePasswordEpic } from '../../app/account/domain/use-cases/change-password/changePasswordEpic';
import { humanProofEpic } from '../../app/account/domain/use-cases/human-proof/humanProofEpic';
import { chooseAvatarEpic } from '../../app/account/domain/use-cases/choose-avatar/chooseAvatarEpic';
import { readOwnAccountEpic } from '../../app/account/domain/use-cases/read-own-account/readOwnAccountEpic';
import { registerAccountEpic } from '../../app/account/domain/use-cases/register-account/registerAccountEpic';

export const accountEpics = [
  registerAccountEpic,
  changePasswordEpic,
  humanProofEpic,
  readOwnAccountEpic,
  chooseAvatarEpic,
];
