// SPEC-007 RG-03 : un défi à la manière d'ALTCHA. L'api tire un nombre, publie
// le condensé SHA-256 de `sel + nombre` et le signe ; le navigateur retrouve le
// nombre en essayant tous ceux jusqu'à `maxNumber`.
export interface HumanChallenge {
  algorithm: 'SHA-256';
  challenge: string;
  salt: string;
  maxNumber: number;
  signature: string;
}

export interface HumanProofSolution {
  algorithm: string;
  challenge: string;
  salt: string;
  number: number;
  signature: string;
}

export interface HumanProof {
  issueChallenge(now: Date): HumanChallenge;
  // Une preuve acceptée est dépensée : la présenter de nouveau la fait refuser.
  accept(solution: HumanProofSolution, now: Date): Promise<boolean>;
}
