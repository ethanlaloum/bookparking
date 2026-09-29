import { createAction } from '@reduxjs/toolkit';

/**
 * Vit à part des quatre epics de modération : les quatre la partagent, et la
 * loger dans l'un d'eux ferait dépendre les trois autres de celui-là.
 */
export const resetModerationState = createAction('backOffice/resetModerationState');
