export enum AdminActionKind {
  UNPUBLISH_LISTING = 'UNPUBLISH_LISTING',
  SUSPEND_ACCOUNT = 'SUSPEND_ACCOUNT',
  LIFT_ACCOUNT_SUSPENSION = 'LIFT_ACCOUNT_SUSPENSION',
  CANCEL_RENTAL_REQUEST = 'CANCEL_RENTAL_REQUEST',
}

export enum AdminTargetType {
  LISTING = 'LISTING',
  ACCOUNT = 'ACCOUNT',
  RENTAL_REQUEST = 'RENTAL_REQUEST',
}

export interface AdminAction {
  adminAccountId: string;
  kind: AdminActionKind;
  targetType: AdminTargetType;
  targetId: string;
  reason: string | null;
  actedAt: Date;
}

export const MINIMUM_REASON_LENGTH = 10;

/**
 * Toute action de modération exige un motif lisible. Ce n'est pas une
 * formalité : c'est ce qui permet, six mois plus tard, de répondre à un
 * propriétaire qui demande pourquoi son annonce a disparu. Un motif vide ou de
 * trois caractères ne répond à personne.
 */
export const isUsableReason = (reason: string): boolean =>
  reason.trim().length >= MINIMUM_REASON_LENGTH;
