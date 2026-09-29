import type { components } from '../../../../api/schema';

export type Account = components['schemas']['RegisterAccountResponse'];

// Le compte connecté, lu par `GET /account` : de quoi afficher son adresse et
// dessiner son avatar.
export type OwnAccount = components['schemas']['OwnAccount'];

export const MINIMUM_PASSWORD_LENGTH = 8;
export const MAXIMUM_EMAIL_LENGTH = 254;

const EMAIL_PATTERN = /^[^\s@'"\\;]+@[^\s@]+\.[^\s@]+$/u;

export const isAcceptableEmail = (email: string): boolean =>
  email.length <= MAXIMUM_EMAIL_LENGTH && EMAIL_PATTERN.test(email);

export const isAcceptablePassword = (password: string): boolean =>
  password.length >= MINIMUM_PASSWORD_LENGTH;
