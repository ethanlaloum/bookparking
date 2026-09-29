import { describe, expect, it } from 'vitest';

import { hasWaitedOverADay, isCancellable, isPending } from './AdminRentalRequest';
import { anAdminRentalRequest } from '../../../../store/testing/InMemoryDependencies';

const MAINTENANT = new Date('2026-09-22T12:00:00.000Z');

describe("une demande qui attend depuis plus d'un jour", () => {
  it("compte à partir de vingt-quatre heures révolues, et pas avant", () => {
    const pileVingtQuatreHeures = anAdminRentalRequest({
      requestedAt: '2026-09-21T12:00:00.000Z',
    });
    const uneMinuteDePlus = anAdminRentalRequest({
      requestedAt: '2026-09-21T11:59:00.000Z',
    });

    expect(hasWaitedOverADay(pileVingtQuatreHeures, MAINTENANT)).toBe(false);
    expect(hasWaitedOverADay(uneMinuteDePlus, MAINTENANT)).toBe(true);
  });

  it("ignore une demande qui n'attend plus", () => {
    const confirmee = anAdminRentalRequest({
      status: 'CONFIRMED',
      requestedAt: '2026-09-01T00:00:00.000Z',
    });

    expect(isPending(confirmee)).toBe(false);
    expect(hasWaitedOverADay(confirmee, MAINTENANT)).toBe(false);
  });
});

describe("ce que l'administration peut encore annuler", () => {
  it("suit exactement le filtre de l'api : en attente ou confirmée", () => {
    expect(isCancellable(anAdminRentalRequest({ status: 'PENDING' }))).toBe(true);
    expect(isCancellable(anAdminRentalRequest({ status: 'CONFIRMED' }))).toBe(true);
    expect(isCancellable(anAdminRentalRequest({ status: 'EXPIRED' }))).toBe(false);
    expect(isCancellable(anAdminRentalRequest({ status: 'CANCELLED' }))).toBe(false);
  });
});
