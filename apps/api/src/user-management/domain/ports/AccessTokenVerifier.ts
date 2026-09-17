export interface AccessTokenPayload {
  id: string;
}

export interface AccessTokenVerifier {
  verify(token: string): Promise<AccessTokenPayload | null>;
}
