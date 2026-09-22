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

const decodePayload = (token: string): AccessTokenPayload | null => {
  try {
    const payload: unknown = JSON.parse(
      Buffer.from(token, 'base64url').toString('utf8'),
    );
    if (
      typeof payload !== 'object' ||
      payload === null ||
      typeof (payload as AccessTokenPayload).accountId !== 'string' ||
      typeof (payload as AccessTokenPayload).validUntil !== 'string'
    )
      return null;
    return payload as AccessTokenPayload;
  } catch {
    return null;
  }
};

export function slidingAccessToken(
  token: string,
  presentedAt: Date,
): SlidingAccessToken | null {
  const payload = decodePayload(token);
  if (payload === null) return null;

  const validUntil = new Date(payload.validUntil);
  if (Number.isNaN(validUntil.getTime())) return null;
  if (presentedAt.getTime() > validUntil.getTime()) return null;

  return {
    accountId: payload.accountId,
    validUntil: new Date(
      presentedAt.getTime() + TOKEN_VALIDITY_IN_MILLISECONDS,
    ),
  };
}
