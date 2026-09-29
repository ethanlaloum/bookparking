import { Either } from 'effect/index';

import { UnknownError } from '../../../../shared/error/errors/UnknownError';
import { UseCase } from '../../../../shared/use-case/UseCase';
import { PendingPush, PushQueue } from '../../ports/PushQueue';
import { PushDeviceRepository } from '../../ports/PushDeviceRepository';
import { PushMessage, PushSender } from '../../ports/PushSender';
import { composePush } from '../../services/composePush';

interface Props {
  now: Date;
}

export interface PushSweepReport {
  pushed: number;
  skipped: number;
  forgotten: number;
}

// Cinquante notifications par balayage, soit au plus quelques centaines de
// messages : Expo en prend cent par requête, l'adaptateur découpe.
const NOTIFICATIONS_PER_SWEEP = 50;

// Un push vaut pour l'instant : une heure après, il arriverait comme une
// nouvelle alors que l'e-mail et la cloche l'ont déjà dite.
const PUSH_WINDOW_IN_MILLISECONDS = 60 * 60 * 1000;

const isStale = (pending: PendingPush, now: Date): boolean =>
  now.getTime() - pending.createdAt.getTime() >= PUSH_WINDOW_IN_MILLISECONDS;

const messagesOf = (pending: PendingPush): PushMessage[] =>
  pending.tokens.map((token) => ({
    to: token,
    ...composePush(pending.kind),
    data: {
      notificationId: pending.notificationId,
      destination: pending.audience === 'OWNER' ? 'received' : 'mine',
    },
  }));

/**
 * Pousse les notifications que personne n'a encore poussées, vers chaque
 * téléphone de leur destinataire. Une notification est close — poussée,
 * périmée ou sans téléphone à viser — une fois pour toutes ; seule une panne
 * d'Expo la garde pour le balayage suivant. Envoyer puis clore n'est pas
 * atomique : un arrêt entre les deux fait partir le même push une seconde
 * fois, jamais le perdre.
 */
export class SendPendingPushes implements UseCase<
  Props,
  Promise<Either.Either<PushSweepReport, UnknownError>>
> {
  constructor(
    private readonly pushQueue: PushQueue,
    private readonly pushDevices: PushDeviceRepository,
    private readonly pushSender: PushSender,
  ) {}

  public async execute(
    props: Props,
  ): Promise<Either.Either<PushSweepReport, UnknownError>> {
    try {
      const report: PushSweepReport = { pushed: 0, skipped: 0, forgotten: 0 };
      const pending = await this.pushQueue.findUnpushed(
        NOTIFICATIONS_PER_SWEEP,
      );
      const stale = pending.filter((push) => isStale(push, props.now));
      const fresh = pending.filter((push) => !isStale(push, props.now));
      report.skipped = stale.length;

      const messages = fresh.flatMap(messagesOf);
      if (messages.length > 0) {
        const outcomes = await this.pushSender.send(messages);
        if (outcomes === 'UNAVAILABLE') {
          await this.close(stale, props.now);
          return Either.right(report);
        }
        const gone = messages
          .filter((_, index) => outcomes[index] === 'GONE')
          .map((message) => message.to);
        if (gone.length > 0) await this.pushDevices.forget(gone);
        report.pushed = outcomes.filter((outcome) => outcome === 'SENT').length;
        report.forgotten = gone.length;
      }

      await this.close(pending, props.now);
      return Either.right(report);
    } catch (error: unknown) {
      return Either.left(
        new UnknownError(
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
  }

  private async close(pending: PendingPush[], now: Date): Promise<void> {
    if (pending.length === 0) return;
    await this.pushQueue.markPushed(
      pending.map((push) => push.notificationId),
      now,
    );
  }
}
