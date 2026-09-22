const TOKEN_VALIDITY_IN_DAYS = 7;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export interface IssuedAccessToken {
  token: string;
  validUntil: Date;
}

export function issueAccessToken(
  accountId: string,
  issuedAt: Date,
): IssuedAccessToken {
  const validUntil = new Date(
    issuedAt.getTime() + TOKEN_VALIDITY_IN_DAYS * MILLISECONDS_PER_DAY,
  );
  const payload = {
    accountId,
    issuedAt: issuedAt.toISOString(),
    validUntil: validUntil.toISOString(),
  };
  const token = Buffer.from(JSON.stringify(payload), 'utf8').toString(
    'base64url',
  );
  return { token, validUntil };
}
