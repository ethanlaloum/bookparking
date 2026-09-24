import { changePasswordEpic } from '../../app/account/domain/use-cases/change-password/changePasswordEpic';
import { humanProofEpic } from '../../app/account/domain/use-cases/human-proof/humanProofEpic';
import { registerAccountEpic } from '../../app/account/domain/use-cases/register-account/registerAccountEpic';

export const accountEpics = [registerAccountEpic, changePasswordEpic, humanProofEpic];
