import {
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from 'node:crypto';

import {
  HumanChallenge,
  HumanProof,
  HumanProofSolution,
} from '../../../domain/ports/HumanProof';

// Q-02 : 50 000 essais au plus, une fraction de seconde dans un navigateur.
const MAX_NUMBER = 50_000;
// Le temps de remplir le formulaire.
const VALIDITY_IN_MILLISECONDS = 20 * 60 * 1000;

const sha256Hex = (value: string): string =>
  createHash('sha256').update(value).digest('hex');

// L'échéance vit dans le sel, lequel entre dans le condensé signé : la
// déplacer changerait le condensé, et la signature ne tiendrait plus.
const expiryInMillisecondsOf = (salt: string): number | null => {
  const match = /\?expires=(\d+)$/u.exec(salt);
  return match === null ? null : Number(match[1]) * 1000;
};

const sameHex = (a: string, b: string): boolean =>
  a.length === b.length &&
  timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));

// Q-03 : les preuves servies vivent en mémoire, dans ce seul fournisseur. Un
// redémarrage, ou une seconde instance, permettrait d'en rejouer une pendant
// ses 20 minutes.
export class HashcashHumanProof implements HumanProof {
  private readonly spent = new Map<string, number>();

  constructor(
    private readonly secret: string,
    private readonly drawNumber: (maxNumber: number) => number = (max) =>
      randomInt(0, max + 1),
    private readonly drawSalt: () => string = () =>
      randomBytes(12).toString('hex'),
  ) {}

  public issueChallenge(now: Date): HumanChallenge {
    const expiresAt = Math.floor(
      (now.getTime() + VALIDITY_IN_MILLISECONDS) / 1000,
    );
    const salt = `${this.drawSalt()}?expires=${expiresAt}`;
    const challenge = sha256Hex(salt + this.drawNumber(MAX_NUMBER));
    return {
      algorithm: 'SHA-256',
      challenge,
      salt,
      maxNumber: MAX_NUMBER,
      signature: this.sign(challenge),
    };
  }

  public async accept(
    solution: HumanProofSolution,
    now: Date,
  ): Promise<boolean> {
    this.forgetExpired(now);
    if (solution.algorithm !== 'SHA-256') return false;

    const expiresAt = expiryInMillisecondsOf(solution.salt);
    if (expiresAt === null || now.getTime() >= expiresAt) return false;
    if (!sameHex(this.sign(solution.challenge), solution.signature))
      return false;
    if (sha256Hex(solution.salt + solution.number) !== solution.challenge)
      return false;
    if (this.spent.has(solution.challenge)) return false;

    this.spent.set(solution.challenge, expiresAt);
    return true;
  }

  private sign(challenge: string): string {
    return createHmac('sha256', this.secret).update(challenge).digest('hex');
  }

  private forgetExpired(now: Date): void {
    for (const [challenge, expiresAt] of this.spent)
      if (expiresAt <= now.getTime()) this.spent.delete(challenge);
  }
}
