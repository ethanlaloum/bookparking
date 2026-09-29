import { signInEpic } from '../../app/auth/domain/use-cases/sign-in/signInEpic';
import { signOutEpic } from '../../app/auth/domain/use-cases/sign-out/signOutEpic';

export const authEpics = [signInEpic, signOutEpic];
