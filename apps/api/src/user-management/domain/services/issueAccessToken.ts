import { createHmac } from 'node:crypto';

const TOKEN_VALIDITY_IN_DAYS = 7;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export interface IssuedAccessToken {
  token: string;
  validUntil: Date;
}

export const signPayload = (payload: string, secret: string): string =>
  createHmac('sha256', secret).update(payload).digest('base64url');

export function issueAccessToken(
  accountId: string,
  issuedAt: Date,
  secret: string,
): IssuedAccessToken {
  const validUntil = new Date(
    issuedAt.getTime() + TOKEN_VALIDITY_IN_DAYS * MILLISECONDS_PER_DAY,
  );
  const payload = Buffer.from(
    JSON.stringify({
      accountId,
      issuedAt: issuedAt.toISOString(),
      validUntil: validUntil.toISOString(),
    }),
    'utf8',
  ).toString('base64url');

  return { token: `${payload}.${signPayload(payload, secret)}`, validUntil };
}
