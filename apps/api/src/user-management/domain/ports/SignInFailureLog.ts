import { SignInFailure } from '../services/signInThrottle';

export interface SignInFailureLog {
  recent(): readonly SignInFailure[];
  record(failure: SignInFailure): void;
  forget(accountKey: string): void;
}
