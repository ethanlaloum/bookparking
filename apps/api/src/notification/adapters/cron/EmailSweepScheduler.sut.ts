import { Sweep } from '../../../shared/scheduler/SweepScheduler';
import { EmailSweepScheduler } from './EmailSweepScheduler';

class RecordingSweep implements Sweep {
  public readonly sweptAt: Date[] = [];

  public async execute(props: { now: Date }): Promise<void> {
    this.sweptAt.push(props.now);
  }
}

const THIRTY_SECONDS = 30 * 1000;

export const createEmailSweepSchedulerSUT = () => {
  const sweep = new RecordingSweep();
  let sweepsBuilt = 0;
  let scheduler: EmailSweepScheduler | null = null;

  return {
    givenSendingDisabledAndTheApiStartsAt(iso: string) {
      jest.useFakeTimers({ now: new Date(iso) });
      scheduler = new EmailSweepScheduler(
        'disabled',
        () => {
          sweepsBuilt += 1;
          return sweep;
        },
        THIRTY_SECONDS,
      );
      scheduler.onModuleInit();
    },

    async whenMinutesPass(minutes: number) {
      await jest.advanceTimersByTimeAsync(minutes * 60 * 1000);
    },

    thenNoEmailSweepHappened() {
      expect(sweepsBuilt).toEqual(0);
      expect(sweep.sweptAt).toEqual([]);
    },

    tearDown() {
      scheduler?.onModuleDestroy();
      jest.useRealTimers();
    },
  };
};
