import {
  OutgoingEmail,
  OutgoingEmailStatus,
} from '../../domain/entities/OutgoingEmail';
import { EmailOutbox } from '../../domain/ports/EmailOutbox';

export class InMemoryEmailOutbox implements EmailOutbox {
  public emails: OutgoingEmail[] = [];
  private failing = false;

  public enableFailureOnEveryWrite(): void {
    this.failing = true;
  }

  public async enqueue(email: OutgoingEmail): Promise<void> {
    if (this.failing) throw new Error('email outbox is unreachable');
    this.emails.push(email);
  }

  public async findQueued(limit: number): Promise<OutgoingEmail[]> {
    return this.emails
      .filter((email) => email.toState().status === 'PENDING')
      .sort((a, b) => a.queuedAt.getTime() - b.queuedAt.getTime())
      .slice(0, limit);
  }

  public async markSent(emailId: string, sentAt: Date): Promise<void> {
    this.leavePending(emailId, 'SENT', { sentAt });
  }

  public async recordUnavailable(emailId: string): Promise<void> {
    this.leavePending(emailId, 'PENDING', {});
  }

  public async markFailed(emailId: string, failedAt: Date): Promise<void> {
    this.leavePending(emailId, 'FAILED', { failedAt });
  }

  private leavePending(
    emailId: string,
    status: OutgoingEmailStatus,
    stamps: { sentAt?: Date; failedAt?: Date },
  ): void {
    this.emails = this.emails.map((email) => {
      const state = email.toState();
      if (state.id !== emailId || state.status !== 'PENDING') return email;
      return OutgoingEmail.fromState({
        ...state,
        ...stamps,
        status,
        attempts: state.attempts + 1,
      });
    });
  }
}
