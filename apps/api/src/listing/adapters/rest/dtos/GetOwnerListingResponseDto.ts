// Le tableau de bord ajoute le statut à ce que la lecture publique montre, et
// rien d'autre : `accessDescription` reste hors de toute réponse, y compris
// pour le propriétaire (AUTO-29). Qui doit voir ce texte, et quand, est une
// question ouverte — la rouvrir est une story, pas un champ de plus ici.
export interface GetOwnerListingResponseDto {
  id: string;
  address: string;
  box: string;
  status: string;
  photos: string[];
  pricing: {
    dayInCents: number | null;
    weekInCents: number | null;
    monthInCents: number | null;
  };
  availability: {
    from: string;
    to: string;
  };
}
