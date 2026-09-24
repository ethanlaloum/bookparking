import { createHash, createHmac } from 'node:crypto';

import { selectHumanProof } from '../../../../../selectors/account/accountSelectors';
import {
  buildInMemoryDependencies,
  type InMemoryDependencies,
} from '../../../../../store/testing/InMemoryDependencies';
import { createTestStore } from '../../../../../store/testing/createTestStore';
import type { HumanChallenge } from '../../entities/HumanProof';
import { registerAccountRequested } from '../register-account/registerAccountEpic';
import { humanProofRequested } from './humanProofEpic';

// Un défi comme l'api les émet, dont le nombre est connu.
const challengeFor = (number: number): HumanChallenge => {
  const salt = 'a1b2c3d4?expires=1790000000';
  const challenge = createHash('sha256').update(salt + String(number)).digest('hex');
  return {
    algorithm: 'SHA-256',
    challenge,
    salt,
    maxNumber: 50000,
    signature: createHmac('sha256', 'cle-de-test').update(challenge).digest('hex'),
  };
};

export const createHumanProofSut = () => {
  const dependencies: InMemoryDependencies = buildInMemoryDependencies();
  const store = createTestStore(dependencies);

  return {
    givenTheApiChallengesWithNumber(number: number): void {
      dependencies.accountGateway.challenge = challengeFor(number);
    },
    givenTheApiRejectsRegistrations(): void {
      dependencies.accountGateway.rejection = 'La vérification anti-robot a échoué.';
    },
    whenTheRegisterScreenAsksForAProof(): void {
      store.dispatch(humanProofRequested());
    },
    whenRegisteringWithTheProof(): void {
      const humanProof = selectHumanProof(store.getState());
      if (humanProof === null) throw new Error('Aucune preuve prête pour l inscription');
      store.dispatch(
        registerAccountRequested({
          email: 'marc.d@example.com',
          password: 'Barla2026!',
          humanProof,
          acceptsTerms: true,
          avatar: 'SIGNAL',
        }),
      );
    },
    thenTheProofCarries(number: number): void {
      const proof = selectHumanProof(store.getState());
      if (proof?.number !== number)
        throw new Error(`Preuve attendue avec ${number}, obtenue ${JSON.stringify(proof)}`);
    },
    thenChallengesAsked(count: number): void {
      if (dependencies.accountGateway.challengesServed !== count)
        throw new Error(
          `${count} défis attendus, ${dependencies.accountGateway.challengesServed} demandés`,
        );
    },
  };
};
