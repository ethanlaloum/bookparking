import { sha256 } from '@noble/hashes/sha2';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils';

import type { components } from '../../../../api/schema';

export type HumanChallenge = components['schemas']['HumanChallenge'];
export type HumanProof = components['schemas']['HumanProof'];

/**
 * SPEC-007 RG-03 : retrouver le nombre dont l'api a publié le condensé, en les
 * essayant tous jusqu'à `maxNumber`. SHA-256 vient de `@noble/hashes` et non de
 * `crypto.subtle`, qui n'existe pas dans l'app iPhone et rendrait chaque essai
 * asynchrone. Rend `null` si aucun nombre ne convient — un défi abîmé.
 */
export const solveHumanChallenge = (challenge: HumanChallenge): HumanProof | null => {
  for (let number = 0; number <= challenge.maxNumber; number += 1) {
    if (bytesToHex(sha256(utf8ToBytes(challenge.salt + String(number)))) === challenge.challenge)
      return {
        algorithm: challenge.algorithm,
        challenge: challenge.challenge,
        salt: challenge.salt,
        number,
        signature: challenge.signature,
      };
  }
  return null;
};
