import { Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

export interface Sweep {
  execute(props: { now: Date }): Promise<unknown>;
}

// Le balayage part de l'horloge du processus, pas de l'arrivée d'une demande :
// c'est ce qui fait qu'une empreinte expirée est levée même quand plus personne
// ne demande de place. Un passage qui dure plus que l'intervalle ne se chevauche
// pas avec le suivant — le suivant est simplement sauté.
export class RentalSweepScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('RentalSweepScheduler');
  private timer: NodeJS.Timeout | null = null;
  private sweeping = false;

  constructor(
    private readonly sweep: Sweep,
    private readonly intervalInMilliseconds: number,
  ) {}

  public onModuleInit(): void {
    this.timer = setInterval(() => {
      void this.sweepOnce();
    }, this.intervalInMilliseconds);
  }

  public onModuleDestroy(): void {
    if (this.timer !== null) clearInterval(this.timer);
    this.timer = null;
  }

  private async sweepOnce(): Promise<void> {
    if (this.sweeping) return;
    this.sweeping = true;
    try {
      await this.sweep.execute({ now: new Date() });
    } catch (error: unknown) {
      this.logger.error({
        errorClass:
          error instanceof Error ? error.constructor.name : typeof error,
        errorMessage: error instanceof Error ? error.message : undefined,
      });
    } finally {
      this.sweeping = false;
    }
  }
}
