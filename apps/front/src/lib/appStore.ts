/**
 * L'adresse de l'app sur l'App Store, posée au build par `VITE_APP_STORE_URL`.
 * Tant qu'elle manque, l'app n'est pas publiée et le bouton le dit : un lien
 * vers une fiche qui n'existe pas serait une promesse fausse. Seule une adresse
 * `https://apps.apple.com/` est retenue — le bouton ne mène jamais ailleurs.
 */
export const appStoreUrl = (): string | null => {
  const url = import.meta.env.VITE_APP_STORE_URL?.trim() ?? '';
  return url.startsWith('https://apps.apple.com/') ? url : null;
};
