import { randomUUID } from 'node:crypto';

interface Props {
  id: string;
  email: string;
  passwordHash: string;
  registeredAt: Date;
}

export class Account {
  private constructor(private readonly props: Props) {}

  public toState(): Props {
    return this.props;
  }

  public static fromState(state: Props): Account {
    return new Account(state);
  }

  public static register(params: {
    email: string;
    passwordHash: string;
    registeredAt: Date;
  }): Account {
    return new Account({ ...params, id: randomUUID() });
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
    return this.props.email === email;
  }
}
