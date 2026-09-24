import { Schema } from 'effect/index';

import { AVATARS } from '../../../domain/entities/Account';

export const AvatarSchema = Schema.Literal(...AVATARS).annotations({
  message: () => `Avatar invalide : ${AVATARS.join(', ')}`,
});

export const ChooseAvatarSchema = Schema.Struct({
  avatar: AvatarSchema,
}).annotations({
  message: () => "Corps de requête invalide pour un choix d'avatar",
});
