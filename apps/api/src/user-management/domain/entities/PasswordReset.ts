import { createHash } from 'node:crypto';

const VALIDITY_IN_MILLISECONDS = 60 * 60 * 1000;
const RESEND_COOLDOWN_IN_MILLISECONDS = 2 * 60 * 1000;

interface Props {
  tokenHash: string;
  accountId: string;
  requestedAt: Date;
  expiresAt: Date;
  spentAt: Date | null;
}

export class PasswordReset {
  private constructor(private readonly props: Props) {}

  public static hashOf(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  public static issue(params: {
    accountId: string;
    token: string;
    requestedAt: Date;
  }): PasswordReset {
    return new PasswordReset({
      tokenHash: PasswordReset.hashOf(params.token),
      accountId: params.accountId,
      requestedAt: params.requestedAt,
      expiresAt: new Date(
        params.requestedAt.getTime() + VALIDITY_IN_MILLISECONDS,
      ),
      spentAt: null,
    });
  }

  public static fromState(state: Props): PasswordReset {
    return new PasswordReset(state);
  }

  public toState(): Props {
    return this.props;
  }

  public isUsableAt(at: Date): boolean {
    return (
      this.props.spentAt === null &&
      at.getTime() < this.props.expiresAt.getTime()
    );
  }

  public allowsAnotherRequestAt(at: Date): boolean {
    return (
      at.getTime() >=
      this.props.requestedAt.getTime() + RESEND_COOLDOWN_IN_MILLISECONDS
    );
  }

  public get tokenHash(): string {
    return this.props.tokenHash;
  }

  public get accountId(): string {
    return this.props.accountId;
  }
}
