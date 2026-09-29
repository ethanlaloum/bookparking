import { RentalSweepScheduler, Sweep } from './RentalSweepScheduler';

class RecordingSweep implements Sweep {
  public readonly sweptAt: Date[] = [];

  public async execute(props: { now: Date }): Promise<void> {
    this.sweptAt.push(props.now);
  }
}

const FIVE_MINUTES = 5 * 60 * 1000;

export const createRentalSweepSchedulerSUT = () => {
  const sweep = new RecordingSweep();
  const scheduler = new RentalSweepScheduler(sweep, FIVE_MINUTES);

  return {
    givenTheApiStartsAt(iso: string) {
      jest.useFakeTimers({ now: new Date(iso) });
      scheduler.onModuleInit();
    },

    async whenMinutesPass(minutes: number) {
      await jest.advanceTimersByTimeAsync(minutes * 60 * 1000);
    },

    whenTheApiStops() {
      scheduler.onModuleDestroy();
    },

    thenSweptAt(expected: string[]) {
      expect(sweep.sweptAt).toEqual(expected.map((iso) => new Date(iso)));
    },

    tearDown() {
      scheduler.onModuleDestroy();
      jest.useRealTimers();
    },
  };
};
