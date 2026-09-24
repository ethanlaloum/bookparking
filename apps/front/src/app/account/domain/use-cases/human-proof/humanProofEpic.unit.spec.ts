import { describe, it } from 'vitest';

import { createHumanProofSut } from './humanProofEpic.sut';

describe('human proof @SPEC-007', () => {
  it('solves the challenge and asks a fresh one after a refused registration @EX-007-19', () => {
    const sut = createHumanProofSut();
    sut.givenTheApiChallengesWithNumber(1234);

    sut.whenTheRegisterScreenAsksForAProof();
    sut.thenTheProofCarries(1234);

    sut.givenTheApiRejectsRegistrations();
    sut.whenRegisteringWithTheProof();
    sut.thenChallengesAsked(2);
    sut.thenTheProofCarries(1234);
  });
});
