import { idempotencyKeyOf, MoneyOwed } from '../entities/RentalMoney';
import { PaymentUnavailableError } from '../errors/PaymentUnavailableError';
import { PaymentGateway } from '../ports/PaymentGateway';
import { RentalRepository } from '../ports/RentalRepository';

export type Settlement = 'SETTLED' | 'STILL_OWED';

// Une panne de Stripe n'est pas une erreur ici : la dette reste écrite en base
// et le balayage suivant la reprend, avec la même clé d'idempotence. Seule une
// réponse de Stripe éteint la dette.
export const settleMoneyOwed = async (
  owed: MoneyOwed,
  rentalRepository: RentalRepository,
  paymentGateway: PaymentGateway,
  now: Date,
): Promise<Settlement> => {
  try {
    if (owed.owed === 'REFUND_DUE') {
      const { refundId } = await paymentGateway.refund(
        owed.paymentId,
        idempotencyKeyOf(owed.requestId, 'refund'),
      );
      await rentalRepository.markRefunded(owed.requestId, refundId);
      return 'SETTLED';
    }

    const outcome = await paymentGateway.release(
      owed.paymentId,
      idempotencyKeyOf(owed.requestId, 'release'),
    );
    if (outcome === 'RELEASED') {
      await rentalRepository.markReleased(owed.requestId);
      return 'SETTLED';
    }

    // Stripe a prélevé sans que la base le sache : seul le loueur prélève, en
    // confirmant. Une demande qui a expiré sur ce malentendu était donc bien
    // confirmée ; toute autre — annulée, abandonnée, refusée — ne devait rien
    // prélever, et ce qui a été pris est rendu.
    if (owed.status === 'EXPIRED') {
      await rentalRepository.recordMissedCapture(owed.requestId, now);
      return 'SETTLED';
    }
    await rentalRepository.oweRefundOfMissedCapture(owed.requestId);
    return settleMoneyOwed(
      { ...owed, owed: 'REFUND_DUE' },
      rentalRepository,
      paymentGateway,
      now,
    );
  } catch (error: unknown) {
    if (error instanceof PaymentUnavailableError) return 'STILL_OWED';
    throw error;
  }
};
