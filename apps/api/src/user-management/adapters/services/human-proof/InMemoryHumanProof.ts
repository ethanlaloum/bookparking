import {
  HumanChallenge,
  HumanProof,
  HumanProofSolution,
} from '../../../domain/ports/HumanProof';

// Doublure des cas d'usage : accepte toute preuve, sauf à qui l'a demandé.
export class InMemoryHumanProof implements HumanProof {
  public presented: HumanProofSolution[] = [];
  private accepting = true;

  public rejectEveryProof(): void {
    this.accepting = false;
  }

  public issueChallenge(): HumanChallenge {
    return {
      algorithm: 'SHA-256',
      challenge: 'challenge-for-test',
      salt: 'salt-for-test',
      maxNumber: 10,
      signature: 'signature-for-test',
    };
  }

  public async accept(solution: HumanProofSolution): Promise<boolean> {
    this.presented.push(solution);
    return this.accepting;
  }
}
