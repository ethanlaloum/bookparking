import { createHashcashHumanProofSUT } from './HashcashHumanProof.sut';

// Heure de Paris, UTC+2 en octobre.
const AT = (parisTime: string) => `2026-10-01T${parisTime}.000+02:00`;

describe('HashcashHumanProof @SPEC-007', () => {
  it('accepts a right proof within its time @EX-007-12', async () => {
    const sut = createHashcashHumanProofSUT();
    const solution = sut.solutionOf(sut.givenChallengeIssuedAt(AT('09:00:00')));

    const accepted = await sut.whenPresentedAt(solution, AT('09:05:00'));

    sut.thenNumberIs(solution);
    sut.thenAccepted(accepted);
  });

  it('accepts a proof only once @EX-007-13', async () => {
    const sut = createHashcashHumanProofSUT();
    const solution = sut.solutionOf(sut.givenChallengeIssuedAt(AT('09:00:00')));
    await sut.whenPresentedAt(solution, AT('09:05:00'));

    const again = await sut.whenPresentedAt(solution, AT('09:06:00'));

    sut.thenRefused(again);
  });

  it('refuses a proof presented twenty minutes after its challenge @EX-007-14', async () => {
    const sut = createHashcashHumanProofSUT();
    const solution = sut.solutionOf(sut.givenChallengeIssuedAt(AT('09:00:00')));

    const accepted = await sut.whenPresentedAt(solution, AT('09:20:00'));

    sut.thenRefused(accepted);
  });

  it('refuses a wrong number @EX-007-15', async () => {
    const sut = createHashcashHumanProofSUT();
    const solution = sut.solutionOf(sut.givenChallengeIssuedAt(AT('09:00:00')));

    const accepted = await sut.whenPresentedAt(
      sut.withNumber(solution, solution.number + 1),
      AT('09:05:00'),
    );

    sut.thenRefused(accepted);
  });

  it('refuses a challenge the api did not sign @EX-007-16', async () => {
    const sut = createHashcashHumanProofSUT();

    const accepted = await sut.whenPresentedAt(
      sut.forgedSolution(),
      AT('09:05:00'),
    );

    sut.thenRefused(accepted);
  });
});
