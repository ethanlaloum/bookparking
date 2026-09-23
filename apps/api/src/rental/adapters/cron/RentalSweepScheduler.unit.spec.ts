import { createRentalSweepSchedulerSUT } from './RentalSweepScheduler.sut';

describe('RentalSweepScheduler @SPEC-004', () => {
  it('sweeps on its own clock, with no other request coming @EX-004-29', async () => {
    const sut = createRentalSweepSchedulerSUT();
    try {
      sut.givenTheApiStartsAt('2026-10-03T07:00:00.000Z');

      await sut.whenMinutesPass(11);
      sut.whenTheApiStops();
      await sut.whenMinutesPass(10);

      sut.thenSweptAt(['2026-10-03T07:05:00.000Z', '2026-10-03T07:10:00.000Z']);
    } finally {
      sut.tearDown();
    }
  });
});
