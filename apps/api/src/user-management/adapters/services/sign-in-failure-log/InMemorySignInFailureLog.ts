import { SignInFailureLog } from '../../../domain/ports/SignInFailureLog';
import {
  forgetFailuresFor,
  forgetStaleFailures,
  SignInFailure,
} from '../../../domain/services/signInThrottle';

export class InMemorySignInFailureLog implements SignInFailureLog {
  private failures: readonly SignInFailure[] = [];

  public recent(): readonly SignInFailure[] {
    return this.failures;
  }

  public record(failure: SignInFailure): void {
    this.failures = [
      ...forgetStaleFailures(this.failures, failure.at),
      failure,
    ];
  }

  public forget(accountKey: string): void {
    this.failures = forgetFailuresFor(this.failures, accountKey);
  }
}
