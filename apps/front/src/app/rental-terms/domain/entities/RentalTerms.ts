import type { components } from '../../../../api/schema';

// Les conditions qu'une demande faite maintenant figerait, réglées depuis le
// back-office : la FAQ, les conditions d'utilisation et « Versements » les
// citent au lieu d'écrire leurs chiffres en dur.
export type RentalTerms = components['schemas']['PlatformSettings'];
