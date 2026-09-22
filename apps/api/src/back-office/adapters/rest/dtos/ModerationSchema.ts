import { Schema } from 'effect/index';

import { MINIMUM_REASON_LENGTH } from '../../../domain/entities/AdminAction';

const REASON_MESSAGE =
  'Une action de modération exige un motif d’au moins 10 caractères';

export const ModerationSchema = Schema.Struct({
  reason: Schema.String.annotations({ message: () => REASON_MESSAGE }).pipe(
    Schema.minLength(MINIMUM_REASON_LENGTH, {
      message: () => REASON_MESSAGE,
    }),
  ),
}).annotations({ message: () => REASON_MESSAGE });
