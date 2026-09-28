import { Schema } from 'effect/index';

import { AVATARS, isAvatar } from '../../../domain/entities/Account';

const AVATAR_MESSAGE = `Avatar invalide : ${AVATARS.join(', ')}`;

export const AvatarSchema = Schema.String.annotations({
  message: () => AVATAR_MESSAGE,
})
  .pipe(Schema.filter(isAvatar))
  .annotations({ message: () => AVATAR_MESSAGE });

export const ChooseAvatarSchema = Schema.Struct({
  avatar: AvatarSchema,
}).annotations({
  message: () => "Corps de requête invalide pour un choix d'avatar",
});
