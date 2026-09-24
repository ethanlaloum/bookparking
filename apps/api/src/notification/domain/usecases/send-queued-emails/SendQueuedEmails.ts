import { Either } from 'effect/index';

import { OutgoingEmail } from '../../../../shared/email-outbox/domain/entities/OutgoingEmail';
import { EmailOutbox } from '../../../../shared/email-outbox/domain/ports/EmailOutbox';
import { UnknownError } from '../../../../shared/error/errors/UnknownError';
import { UseCase } from '../../../../shared/use-case/UseCase';
import { EmailSender } from '../../ports/EmailSender';
import { composeEmail } from '../../services/composeEmail';

interface Props {
  now: Date;
}

export interface EmailSweepReport {
  sent: number;
  retried: number;
  abandoned: number;
}

// Un lot par balayage ; le reste attend le suivant, trente secondes plus tard.
const EMAILS_PER_SWEEP = 50;

// La durée de vie d'une clé d'idempotence chez Resend (Q-01). Au-delà, renvoyer
// un e-mail dont la réponse s'est perdue pourrait l'expédier deux fois.
const RETRY_WINDOW_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

const hasOutlivedRetryWindow = (email: OutgoingEmail, now: Date): boolean =>
  now.getTime() - email.queuedAt.getTime() >= RETRY_WINDOW_IN_MILLISECONDS;

export class SendQueuedEmails implements UseCase<
  Props,
  Promise<Either.Either<EmailSweepReport, UnknownError>>
> {
  constructor(
    private readonly emailOutbox: EmailOutbox,
    private readonly emailSender: EmailSender,
    private readonly siteUrl: string,
  ) {}

  public async execute(
    props: Props,
  ): Promise<Either.Either<EmailSweepReport, UnknownError>> {
    try {
      const report: EmailSweepReport = { sent: 0, retried: 0, abandoned: 0 };

      for (const email of await this.emailOutbox.findQueued(EMAILS_PER_SWEEP)) {
        const delivery = await this.emailSender.send({
          idempotencyKey: email.id,
          to: email.recipient,
          ...composeEmail(email, this.siteUrl),
        });

        if (delivery === 'ACCEPTED') {
          await this.emailOutbox.markSent(email.id, props.now);
          report.sent += 1;
        } else if (
          delivery === 'REFUSED' ||
          hasOutlivedRetryWindow(email, props.now)
        ) {
          await this.emailOutbox.markFailed(email.id, props.now);
          report.abandoned += 1;
        } else {
          await this.emailOutbox.recordUnavailable(email.id);
          report.retried += 1;
        }
      }

      return Either.right(report);
    } catch (error: unknown) {
      return Either.left(
        new UnknownError(
          error instanceof Error ? error.message : String(error),
        ),
      );
    }
  }
}
