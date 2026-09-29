import { createEmailSweepSchedulerSUT } from './EmailSweepScheduler.sut';

describe('EmailSweepScheduler @SPEC-006', () => {
  it('never sweeps when sending is disabled @EX-006-24', async () => {
    const sut = createEmailSweepSchedulerSUT();
    try {
      sut.givenSendingDisabledAndTheApiStartsAt('2026-10-01T07:00:00.000Z');

      await sut.whenMinutesPass(10);

      sut.thenNoEmailSweepHappened();
    } finally {
      sut.tearDown();
    }
  });
});
