import { randomUUID } from 'node:crypto';

const normalizeEmail = (email: string): string =>
  email.normalize('NFKC').replace(/\s+/gu, ' ').trim().toLowerCase();

// Les cinq pilotes entre lesquels on choisit son avatar, à l'inscription puis
// dans « Réglages ». `SIGNAL` est celui des comptes d'avant le choix.
export const AVATARS = [
  'SIGNAL',
  'MARKING',
  'RIVIERA',
  'ASPHALT',
  'CHECKERED',
] as const;
export type Avatar = (typeof AVATARS)[number];

interface Props {
  id: string;
  email: string;
  passwordHash: string;
  registeredAt: Date;
  // SPEC-008 : l'instant où le titulaire a coché la case des conditions
  // d'utilisation. `null` pour les comptes inscrits avant qu'elle existe.
  termsAcceptedAt: Date | null;
  avatar: Avatar;
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
    termsAcceptedAt: Date;
    avatar: Avatar;
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

  public get avatar(): Avatar {
    return this.props.avatar;
  }

  public chooseAvatar(avatar: Avatar): Account {
    return new Account({ ...this.props, avatar });
  }

  public get passwordHash(): string {
    return this.props.passwordHash;
  }

  public isIdentifiedBy(email: string): boolean {
    return this.props.email === normalizeEmail(email);
  }
}
