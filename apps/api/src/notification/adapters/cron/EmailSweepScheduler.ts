import { Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

import {
  EmailSending,
  ResendSettings,
} from '../../../infra/config/environment';
import {
  Sweep,
  SweepScheduler,
} from '../../../shared/scheduler/SweepScheduler';

// Désactivé (`EMAIL_SENDING=disabled`), le balayage n'est même pas construit :
// sans clé, il n'y a rien à construire, et les e-mails restent en file.
export class EmailSweepScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('EmailSweepScheduler');
  private readonly scheduler: SweepScheduler | null;

  constructor(
    sending: EmailSending,
    sweepFor: (settings: ResendSettings) => Sweep,
    intervalInMilliseconds: number,
  ) {
    this.scheduler =
      sending === 'disabled'
        ? null
        : new SweepScheduler(
            'EmailSweepScheduler',
            sweepFor(sending),
            intervalInMilliseconds,
          );
  }

  public onModuleInit(): void {
    if (this.scheduler === null) {
      this.logger.warn(
        'EMAIL_SENDING=disabled : aucun e-mail ne part, ils restent en file.',
      );
      return;
    }
    this.scheduler.onModuleInit();
  }

  public onModuleDestroy(): void {
    this.scheduler?.onModuleDestroy();
  }
}
