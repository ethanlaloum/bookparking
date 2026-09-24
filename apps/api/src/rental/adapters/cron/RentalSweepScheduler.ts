import {
  Sweep,
  SweepScheduler,
} from '../../../shared/scheduler/SweepScheduler';

export type { Sweep };

// Le mécanisme vit dans `SweepScheduler`, partagé avec le balayage des
// e-mails (SPEC-006) ; cette classe n'existe que pour donner à Nest un
// fournisseur distinct, et au journal son nom.
export class RentalSweepScheduler extends SweepScheduler {
  constructor(sweep: Sweep, intervalInMilliseconds: number) {
    super('RentalSweepScheduler', sweep, intervalInMilliseconds);
  }
}
