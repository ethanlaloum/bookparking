import { Delay } from '../../../domain/ports/Delay';

export class TimerDelay implements Delay {
  public wait(milliseconds: number): Promise<void> {
    if (milliseconds <= 0) return Promise.resolve();
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }
}
