import { Avatar } from '../../../domain/entities/Account';

// Ce que le titulaire lit de son propre compte : de quoi dessiner son avatar
// et afficher son adresse. Ni empreinte, ni dates, ni suspension.
export interface OwnAccountResponseDto {
  id: string;
  email: string;
  avatar: Avatar;
}
