import { timingSafeEqual } from 'node:crypto';

import { signPayload } from './issueAccessToken';

const TOKEN_VALIDITY_IN_DAYS = 7;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const TOKEN_VALIDITY_IN_MILLISECONDS =
  TOKEN_VALIDITY_IN_DAYS * MILLISECONDS_PER_DAY;

export interface SlidingAccessToken {
  accountId: string;
  validUntil: Date;
}

interface AccessTokenPayload {
  accountId: string;
  issuedAt: string;
  validUntil: string;
}

const hasValidSignature = (
  payload: string,
  signature: string,
  secret: string,
): boolean => {
  const expected = Buffer.from(signPayload(payload, secret), 'utf8');
  const presented = Buffer.from(signature, 'utf8');
  return (
    expected.length === presented.length && timingSafeEqual(expected, presented)
  );
};

const decodePayload = (payload: string): AccessTokenPayload | null => {
  try {
    const decoded: unknown = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8'),
    );
    if (
      typeof decoded !== 'object' ||
      decoded === null ||
      typeof (decoded as AccessTokenPayload).accountId !== 'string' ||
      typeof (decoded as AccessTokenPayload).validUntil !== 'string'
    )
      return null;
    return decoded as AccessTokenPayload;
  } catch {
    return null;
  }
};

export function slidingAccessToken(
  token: string,
  presentedAt: Date,
  secret: string,
): SlidingAccessToken | null {
  const [payload, signature, ...extra] = token.split('.');
  if (payload === undefined || signature === undefined || extra.length > 0)
    return null;
  if (!hasValidSignature(payload, signature, secret)) return null;

  const decoded = decodePayload(payload);
  if (decoded === null) return null;

  const validUntil = new Date(decoded.validUntil);
  if (Number.isNaN(validUntil.getTime())) return null;
  if (presentedAt.getTime() > validUntil.getTime()) return null;

  return {
    accountId: decoded.accountId,
    validUntil: new Date(
      presentedAt.getTime() + TOKEN_VALIDITY_IN_MILLISECONDS,
    ),
  };
}
