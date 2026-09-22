const FAILURE_WINDOW_IN_MINUTES = 15;
const FAILURE_WINDOW_IN_MILLISECONDS = FAILURE_WINDOW_IN_MINUTES * 60 * 1000;
const FAILURES_BEFORE_DELAY = 2;
const FIRST_DELAY_IN_MILLISECONDS = 1000;
const MAXIMUM_DELAY_IN_MILLISECONDS = 30000;

export interface SignInFailure {
  accountKey: string;
  originKey: string;
  at: Date;
}

export interface SignInAttempt {
  accountKey: string;
  originKey: string;
  at: Date;
}

const isRecent = (failure: SignInFailure, now: Date): boolean =>
  now.getTime() - failure.at.getTime() < FAILURE_WINDOW_IN_MILLISECONDS;

export function countRecentFailures(
  failures: readonly SignInFailure[],
  key: string,
  now: Date,
): number {
  return failures.filter(
    (failure) =>
      isRecent(failure, now) &&
      (failure.accountKey === key || failure.originKey === key),
  ).length;
}

export function forgetFailuresFor(
  failures: readonly SignInFailure[],
  accountKey: string,
): SignInFailure[] {
  return failures.filter((failure) => failure.accountKey !== accountKey);
}

export function signInDelayInMilliseconds(
  failures: readonly SignInFailure[],
  attempt: SignInAttempt,
): number {
  const recent = Math.max(
    countRecentFailures(failures, attempt.accountKey, attempt.at),
    countRecentFailures(failures, attempt.originKey, attempt.at),
  );
  if (recent < FAILURES_BEFORE_DELAY) return 0;
  const doublings = recent - FAILURES_BEFORE_DELAY;
  return Math.min(
    FIRST_DELAY_IN_MILLISECONDS * 2 ** doublings,
    MAXIMUM_DELAY_IN_MILLISECONDS,
  );
}
