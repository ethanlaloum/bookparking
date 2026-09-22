export interface Session {
  token: string;
  validUntil: string;
}

export const isSessionLive = (session: Session | null, now: Date): boolean => {
  if (session === null) return false;
  const expiry = Date.parse(session.validUntil);
  if (Number.isNaN(expiry)) return false;
  return expiry > now.getTime();
};

export const millisecondsBeforeExpiry = (session: Session, now: Date): number => {
  const expiry = Date.parse(session.validUntil);
  if (Number.isNaN(expiry)) return 0;
  return Math.max(0, expiry - now.getTime());
};
