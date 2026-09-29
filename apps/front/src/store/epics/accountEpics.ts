import { changePasswordEpic } from '../../app/account/domain/use-cases/change-password/changePasswordEpic';
import { registerAccountEpic } from '../../app/account/domain/use-cases/register-account/registerAccountEpic';

export const accountEpics = [registerAccountEpic, changePasswordEpic];
