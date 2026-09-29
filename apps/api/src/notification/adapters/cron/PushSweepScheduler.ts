import {
  Sweep,
  SweepScheduler,
} from '../../../shared/scheduler/SweepScheduler';

// Le mécanisme vit dans `SweepScheduler` ; cette classe donne à Nest un
// fournisseur distinct, et au journal son nom. Sans téléphone enregistré, un
// balayage ne fait qu'une lecture et n'appelle jamais Expo.
export class PushSweepScheduler extends SweepScheduler {
  constructor(sweep: Sweep, intervalInMilliseconds: number) {
    super('PushSweepScheduler', sweep, intervalInMilliseconds);
  }
}
