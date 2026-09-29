import { createHash, createHmac } from 'node:crypto';

import {
  HumanChallenge,
  HumanProofSolution,
} from '../../../domain/ports/HumanProof';
import { HashcashHumanProof } from './HashcashHumanProof';

const SECRET_FOR_TEST = 'human-proof-secret-for-test';
const DRAWN_NUMBER = 1234;

const sha256Hex = (value: string): string =>
  createHash('sha256').update(value).digest('hex');

// Ce que fait le navigateur : essayer chaque nombre jusqu'à `maxNumber`.
const solve = (challenge: HumanChallenge): HumanProofSolution => {
  for (let number = 0; number <= challenge.maxNumber; number += 1)
    if (sha256Hex(challenge.salt + number) === challenge.challenge)
      return {
        algorithm: challenge.algorithm,
        challenge: challenge.challenge,
        salt: challenge.salt,
        number,
        signature: challenge.signature,
      };
  throw new Error('challenge has no solution');
};

export const createHashcashHumanProofSUT = () => {
  const humanProof = new HashcashHumanProof(
    SECRET_FOR_TEST,
    () => DRAWN_NUMBER,
    () => 'a1b2c3d4',
  );

  return {
    givenChallengeIssuedAt(iso: string): HumanChallenge {
      return humanProof.issueChallenge(new Date(iso));
    },

    solutionOf(challenge: HumanChallenge): HumanProofSolution {
      return solve(challenge);
    },

    withNumber(
      solution: HumanProofSolution,
      number: number,
    ): HumanProofSolution {
      return { ...solution, number };
    },

    // Un défi fabriqué hors de l'api, pour un nombre connu : bien formé, bien
    // résolu, mais signé d'une autre clé.
    forgedSolution(): HumanProofSolution {
      const salt = 'f0f0f0f0?expires=9999999999';
      const challenge = sha256Hex(salt + 42);
      return {
        algorithm: 'SHA-256',
        challenge,
        salt,
        number: 42,
        signature: createHmac('sha256', 'another-secret')
          .update(challenge)
          .digest('hex'),
      };
    },

    async whenPresentedAt(
      solution: HumanProofSolution,
      iso: string,
    ): Promise<boolean> {
      return humanProof.accept(solution, new Date(iso));
    },

    thenNumberIs(solution: HumanProofSolution) {
      expect(solution.number).toEqual(DRAWN_NUMBER);
    },

    thenAccepted(accepted: boolean) {
      expect(accepted).toEqual(true);
    },

    thenRefused(accepted: boolean) {
      expect(accepted).toEqual(false);
    },
  };
};
