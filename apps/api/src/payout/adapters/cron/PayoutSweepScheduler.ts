import {
  Sweep,
  SweepScheduler,
} from '../../../shared/scheduler/SweepScheduler';

// Le mécanisme vit dans `SweepScheduler` ; cette classe donne à Nest un
// fournisseur distinct, et au journal son nom.
export class PayoutSweepScheduler extends SweepScheduler {
  constructor(sweep: Sweep, intervalInMilliseconds: number) {
    super('PayoutSweepScheduler', sweep, intervalInMilliseconds);
  }
}
