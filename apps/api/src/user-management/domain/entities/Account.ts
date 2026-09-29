import { randomUUID } from 'node:crypto';

const normalizeEmail = (email: string): string =>
  email.normalize('NFKC').replace(/\s+/gu, ' ').trim().toLowerCase();

interface Props {
  id: string;
  email: string;
  passwordHash: string;
  registeredAt: Date;
  suspendedAt: Date | null;
}

export class Account {
  private constructor(private readonly props: Props) {}

  public toState(): Props {
    return this.props;
  }

  public static fromState(state: Props): Account {
    return new Account(state);
  }

  public static normalizeEmail(email: string): string {
    return normalizeEmail(email);
  }

  public static register(params: {
    email: string;
    passwordHash: string;
    registeredAt: Date;
  }): Account {
    return new Account({
      ...params,
      email: normalizeEmail(params.email),
      id: randomUUID(),
      suspendedAt: null,
    });
  }

  // Une suspension qui n'empêche pas de se connecter n'est qu'une mention :
  // c'est `SignIn` qui la fait respecter, en consultant ce prédicat.
  public isSuspended(): boolean {
    return this.props.suspendedAt !== null;
  }

  public get id(): string {
    return this.props.id;
  }

  public get email(): string {
    return this.props.email;
  }

  public get passwordHash(): string {
    return this.props.passwordHash;
  }

  public isIdentifiedBy(email: string): boolean {
    return this.props.email === normalizeEmail(email);
  }
}
